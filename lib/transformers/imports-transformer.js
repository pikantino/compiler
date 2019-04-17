"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const ts = require("typescript");
function importsTransformerFactory(filePath, options, usedTypesMap) {
    function getAbsolutePath(moduleSpecifier) {
        if (path.isAbsolute(moduleSpecifier)) {
            return moduleSpecifier;
        }
        return path.join(filePath, '../', moduleSpecifier);
    }
    function isIndex(absolutePath) {
        return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory();
    }
    function isDependency(moduleSpecifier) {
        return Object.keys(options.packagesFilesMap.modules).some((key) => moduleSpecifier.startsWith(key));
    }
    function isGlobal(moduleSpecifier) {
        return Object.keys(options.packagesFilesMap.globals).some((key) => moduleSpecifier.startsWith(key));
    }
    function checkIfClauseIsEmpty(importClause) {
        if (importClause && importClause.namedBindings && importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
            return importClause.namedBindings.elements.length === 0;
        }
        return false;
    }
    function filterImportClause(importClause) {
        if (importClause && importClause.namedBindings && importClause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
            return ts.createImportClause(importClause.name, ts.createNamedImports(importClause.namedBindings.elements
                .filter((spec) => usedTypesMap[spec.name.text] !== false)));
        }
        return importClause;
    }
    function createImportDeclaration(importClause, moduleSpecifier) {
        const filteredClause = filterImportClause(importClause);
        if (checkIfClauseIsEmpty(filteredClause)) {
            return;
        }
        return ts.createImportDeclaration(undefined, undefined, filterImportClause(importClause), ts.createStringLiteral(moduleSpecifier));
    }
    function createExportDeclaration(exportClause, moduleSpecifier) {
        return ts.createExportDeclaration(undefined, undefined, exportClause, ts.createStringLiteral(moduleSpecifier));
    }
    return (context) => {
        const visit = (node) => {
            if (ts.isImportDeclaration(node)) {
                const moduleSpecifier = node.moduleSpecifier.text; // For some reason field "text" isn't described in signature but exist in final object
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
                }
                else {
                    return createImportDeclaration(node.importClause, `${moduleSpecifier}.js`);
                }
            }
            if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
                const moduleSpecifier = node.moduleSpecifier.text; // For some reason field "text" isn't described in signature but exist in final object
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
exports.importsTransformerFactory = importsTransformerFactory;
