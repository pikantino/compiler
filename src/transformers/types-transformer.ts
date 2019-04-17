import * as ts from 'typescript';

export function typesTransformer(usedTypesMap: { [key: string]: boolean }) {
    return (context) => {
        const visit = (node) => {
            try {
                if (node && ts.isTypeReferenceNode(node)) {
                    const text = node.typeName.getText();
                    const isConstructorArgument: boolean = !!node.parent &&
                        !!node.parent.parent && ts.isConstructorDeclaration(node.parent.parent);

                    if (isConstructorArgument) {
                        usedTypesMap[text] = true;
                        return ts.visitEachChild(node, (child) => child && visit(child), context);
                    }

                    usedTypesMap[text] = !!usedTypesMap[text];
                    return;
                }
                const isPartOfModuleSpecifier = !!node.parent && ts.isImportSpecifier(node.parent);
                if (node && ts.isIdentifier(node) && !isPartOfModuleSpecifier) {
                    usedTypesMap[node.getText()] = true;
                }
                return ts.visitEachChild(node, (child) => child && visit(child), context);
            } catch (e) {
                return node;
            }
        };

        return (node) => ts.visitNode(node, visit);
    };
}
