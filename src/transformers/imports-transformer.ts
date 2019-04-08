import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';

import {CompilingOptions} from "../models/compiling-options";

export function importsTransformerFactory(filePath: string, options: CompilingOptions, usedTypesMap: { [key: string]: boolean }) {
    function getAbsolutePath(moduleSpecifier): string {
        if (path.isAbsolute(moduleSpecifier)) {
            return moduleSpecifier;
        }
        return path.join(filePath, '../', moduleSpecifier);
    }

    function isIndex(absolutePath): boolean {
        return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory();
    }

    function isDependency(moduleSpecifier): boolean {
        return Object.keys(options.packagesFilesMap.modules).some((key: string) =>
            moduleSpecifier.startsWith(key));
    }

    function isGlobal(moduleSpecifier: string): boolean {
        return Object.keys(options.packagesFilesMap.globals).some((key: string) =>
            moduleSpecifier.startsWith(key));
    }

    function checkIfClauseIsEmpty(importClause: ts.ImportClause): boolean {
        if (importClause && importClause.namedBindings && importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
            return importClause.namedBindings.elements.length === 0;
        }
        return false
    }

    function filterImportClause(importClause: ts.ImportClause): ts.ImportClause {
        if (importClause && importClause.namedBindings && importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
            return ts.createImportClause(
                importClause.name,
                ts.createNamedImports(
                    importClause.namedBindings.elements
                        .filter((spec: ts.ImportSpecifier) =>
                            usedTypesMap[spec.name.text] !== false)))
        }
        return importClause;
    }

    function createImportDeclaration(importClause: ts.ImportClause, moduleSpecifier): ts.ImportDeclaration {
        const filteredClause = filterImportClause(importClause);

        if (checkIfClauseIsEmpty(filteredClause)) {
            return;
        }

        return ts.createImportDeclaration(
            undefined,
            undefined,
            filterImportClause(importClause),
            ts.createStringLiteral(moduleSpecifier)
        );
    }

    function createExportDeclaration(exportClause, moduleSpecifier): ts.ExportDeclaration {
        return ts.createExportDeclaration(
            undefined,
            undefined,
            exportClause,
            ts.createStringLiteral(moduleSpecifier)
        );
    }

    return (context) => {
        const visit = (node) => {
            if (ts.isImportDeclaration(node)) {
                const moduleSpecifier: string = (node as any).moduleSpecifier.text; // For some reason field "text" isn't described in signature but exist in final object
                if (isGlobal(moduleSpecifier)) {
                    return;
                }
                if (isDependency(moduleSpecifier)) {
                    return createImportDeclaration(node.importClause, options.packagesFilesMap.resolvePath(moduleSpecifier));
                }
                if (isIndex(getAbsolutePath(moduleSpecifier))) {
                    return createImportDeclaration(node.importClause, `${moduleSpecifier}/index.js`);
                }
                if (!moduleSpecifier.startsWith('/') && !moduleSpecifier.startsWith('.')) {
                    return createImportDeclaration(node.importClause, `/${moduleSpecifier}.js`);
                } else {
                    return createImportDeclaration(node.importClause, `${moduleSpecifier}.js`);
                }
            }
            if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
                const moduleSpecifier = (node as any).moduleSpecifier.text; // For some reason field "text" isn't described in signature but exist in final object
                if (isIndex(getAbsolutePath(moduleSpecifier))) {
                    return createExportDeclaration(node.exportClause, `${moduleSpecifier}/index.js`);
                }
                return createExportDeclaration(node.exportClause, `${moduleSpecifier}.js`);
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };

        return (node) => ts.visitNode(node, visit);
    };
}
