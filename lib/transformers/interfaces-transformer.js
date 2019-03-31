"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function interfacesTransformerFactory() {
    return (context) => {
        const visit = (node) => {
            if (ts.isInterfaceDeclaration(node)) {
                return ts.createClassDeclaration(undefined, [ts.createModifier(ts.SyntaxKind.ExportKeyword)], node.name.getFullText(), undefined, undefined, []);
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };
        return (node) => ts.visitNode(node, visit);
    };
}
exports.interfacesTransformerFactory = interfacesTransformerFactory;
