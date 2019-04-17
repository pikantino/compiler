import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs-extra';

import {CompilingOptions} from "../models/compiling-options";
import {processStyles} from "../helpers/styles-processor";

export function componentTransformerFactory(filePath, options: CompilingOptions, provideDependency: (dep: string) => void) {
    function handleStringLiteralProperty(property) {
        const name = property.name.getText();

        if (name === 'templateUrl') {
            const text = property.initializer.getText().slice(1, -1);
            const templateUrl = path.relative(options.cwd, path.join(filePath, '../', text));
            const value = fs.readFileSync(templateUrl).toString();

            provideDependency(templateUrl);

            return ts.createPropertyAssignment('template', ts.createStringLiteral(value));
        }
        return property;

    }

    function handleArrayProperty(property) {
        const name = property.name.getText();

        if (name === 'styleUrls') {
            const array = [];

            property.initializer.forEachChild((value) => {
                const text = value.getText().slice(1, -1);
                const styleUrl = path.relative(options.cwd, path.join(filePath, '../', text));
                const rebasedUrl = path.join(options.cwd, options.outDir, filePath, '../', text);
                const output = processStyles(options, styleUrl, rebasedUrl);

                provideDependency(styleUrl);

                array.push(ts.createLiteral(output));
            });

            return ts.createPropertyAssignment('styles', ts.createArrayLiteral(array, true));
        }
        return property;
    }

    function createPropertyAssignment(property) {
        if (property.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            return handleArrayProperty(property);
        } else if (property.initializer.kind === ts.SyntaxKind.StringLiteral) {
            return handleStringLiteralProperty(property);
        } else {
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
