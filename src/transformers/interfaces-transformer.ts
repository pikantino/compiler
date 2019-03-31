import * as ts from 'typescript';

export function interfacesTransformerFactory() {
    return (context) => {
        const visit = (node) => {
            if (ts.isInterfaceDeclaration(node)) {
                return ts.createClassDeclaration(
                    undefined,
                    [ts.createModifier(ts.SyntaxKind.ExportKeyword)],
                    node.name.getFullText(),
                    undefined,
                    undefined,
                    []);
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };

        return (node) => ts.visitNode(node, visit);
    };
}
