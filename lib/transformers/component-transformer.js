"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const path = require("path");
const fs = require("fs-extra");
const sass = require("node-sass");
const postcss = require("postcss");
const postcssUrl = require("postcss-url");
let count = 0;
function componentTransformerFactory(filePath, options, provideDependency) {
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
    function resolveImportPath(url, prev) {
        let resolvedUrl = url;
        if (url.startsWith('~')) {
            resolvedUrl = path.join(options.cwd, url.slice(1));
        }
        return {
            file: resolvedUrl
        };
    }
    function handleArrayProperty(property) {
        const name = property.name.getText();
        if (name === 'styleUrls') {
            const array = [];
            property.initializer.forEachChild((value) => {
                const text = value.getText().slice(1, -1);
                const styleUrl = path.relative(options.cwd, path.join(filePath, '../', text));
                const compiled = sass.renderSync({ file: styleUrl, importer: resolveImportPath });
                const css = compiled.css.toString(); // TODO
                const output = postcss()
                    .use(postcssUrl({
                    url: "rebase"
                }))
                    .process(css, {
                    from: styleUrl,
                    to: "dist/index.css"
                });
                if (count === 0) {
                    const regex = /url\(['"](.*?)['"]\)/gm;
                    const result = css.match(regex);
                    if (result) {
                        console.log(filePath);
                        count += 1;
                        console.log(css);
                    }
                }
                provideDependency(styleUrl);
                array.push(ts.createLiteral(css));
            });
            return ts.createPropertyAssignment('styles', ts.createArrayLiteral(array, true));
        }
        return property;
    }
    function createPropertyAssignment(property) {
        if (property.initializer.kind === ts.SyntaxKind.ArrayLiteralExpression) {
            return handleArrayProperty(property);
        }
        else if (property.initializer.kind === ts.SyntaxKind.StringLiteral) {
            return handleStringLiteralProperty(property);
        }
        else {
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
                if (node.expression.expression.getText() === 'Component') {
                    return ts.createDecorator(ts.createCall(ts.createIdentifier('Component'), undefined, [
                        ts.createObjectLiteral(createPropertiesArray(node.expression), true)
                    ]));
                }
            }
            return ts.visitEachChild(node, (child) => visit(child), context);
        };
        return (node) => ts.visitNode(node, visit);
    };
}
exports.componentTransformerFactory = componentTransformerFactory;
