"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function inputsTransformer(emitUnsedTypes) {
    return (context) => {
        const types = {};
        const visit = (node) => {
            if (ts.isTypeReferenceNode(node)) {
                types[node.getText()] = !!types[node.getText()];
                return;
            }
            const importSpecifierParent = node.parent && ts.isImportSpecifier(node.parent);
            if (ts.isIdentifier(node) && !importSpecifierParent) {
                types[node.getText()] = true;
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };
        return (node) => {
            const result = ts.visitNode(node, visit);
            console.log(types);
            return result;
        };
    };
}
exports.inputsTransformer = inputsTransformer;
