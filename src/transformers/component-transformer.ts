import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';

import {TranspileOptions} from "../models/transpile-options";

export function componentTransformerFactory(filePath, options: TranspileOptions, provideDependency: (dep: string) => void) {
    function handleStringLiteralProperty(property) {
        let name = property.name.getText();

        const text = property.initializer.getText().slice(1, -1);

        let value;

        if (name === 'templateUrl') {
            const templateUrl = path.relative(options.cwd, path.join(filePath, '../', text));

            value = fs.readFileSync(templateUrl).toString();
            provideDependency(templateUrl);
            name = 'template';
        } else {
            value = text;
        }

        return ts.createPropertyAssignment(name, ts.createStringLiteral(value));
    }

    function handleArrayProperty(property) {
        let name = property.name.getText();

        const array = [];

        if (name === 'styleUrls') {
            property.initializer.forEachChild((value) => {
                const text = value.getText().slice(1, -1);
                const styleUrl = path.relative(options.cwd, path.join(filePath, '../', text));
                const file = fs.readFileSync(styleUrl).toString();

                provideDependency(styleUrl);
                array.push(ts.createLiteral(file));
                name = 'styles';
            });
        } else {
            property.initializer.forEachChild((value) => {
                array.push(ts.createLiteral(value));
            });
        }

        return ts.createPropertyAssignment(name, ts.createArrayLiteral(array, true));
    }

    function createPropertyAssignment(property) {
        if (property.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            return handleArrayProperty(property);
        } else if (property.initializer.kind === ts.SyntaxKind.StringLiteral) {
            return handleStringLiteralProperty(property);
        } else {
            console.warn(`Cannot transform decorator property of kind ${property.initializer.kind} in ${filePath}`);
            return property;
        }
    }

    function createPropertiesArray(node) {
        const result = [];
        node.arguments[0].forEachChild((property) => {
            result.push(createPropertyAssignment(property));
        });
        return result;
    }

    return (context) => {
        const visit = (node) => {
            if (ts.isDecorator(node)) {
                if ((node.expression as any).expression.getText() === 'Component') {
                    return ts.createDecorator(
                        ts.createCall(
                            ts.createIdentifier('Component'),
                            undefined,
                            [
                                ts.createObjectLiteral(createPropertiesArray(node.expression), true)
                            ]
                        )
                    );
                }
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };

        return (node) => ts.visitNode(node, visit);
    };
}
