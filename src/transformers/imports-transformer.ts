import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';

import {CompilerOptions} from "../models/transpile-options";

export function importsTransformerFactory(filePath: string, options: CompilerOptions) {
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
        return Object.keys(options.packagesFilesMap.map).some((key: string) =>
            moduleSpecifier.startsWith(key));
    }

    function createImportDeclaration(importClause, moduleSpecifier): ts.ImportDeclaration {
        return ts.createImportDeclaration(
            undefined,
            undefined,
            importClause,
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
                const moduleSpecifier = (node as any).moduleSpecifier.text; // For some reason field "text" isn't described in signature but exist in final object
                if (isDependency(moduleSpecifier)) {
                    return createImportDeclaration(node.importClause, options.packagesFilesMap.resolvePath(moduleSpecifier));
                }
                if (isIndex(getAbsolutePath(moduleSpecifier))) {
                    return createImportDeclaration(node.importClause, `${moduleSpecifier}/index.js`);
                }
                return createImportDeclaration(node.importClause, `${moduleSpecifier}.js`);
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
