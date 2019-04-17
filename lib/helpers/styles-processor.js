"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sass = require("node-sass");
const postcss = require("postcss");
const postcssUrl = require("postcss-url");
const path = require("path");
const fs = require("fs");
function processStyles(options, filePath, rebasedPath) {
    const compiled = sass.renderSync({
        file: filePath, importer: getImporter(options)
    });
    const css = compiled.css.toString();
    const output = postcss()
        .use(postcssUrl({
        url: 'rebase'
    }))
        .process(css, {
        from: filePath,
        to: rebasedPath
    });
    return output.css;
}
exports.processStyles = processStyles;
function getImporter(options) {
    return (url, prev) => {
        let resolvedUrl = url;
        if (url.startsWith('~')) {
            const withoutTilde = url.slice(1);
            if (isImportExists(path.join(options.cwd, withoutTilde))) {
                resolvedUrl = path.join(options.cwd, withoutTilde);
            }
            else {
                resolvedUrl = path.join(options.cwd, 'node_modules', withoutTilde);
            }
        }
        return {
            file: resolvedUrl
        };
    };
}
function isImportExists(url) {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    const folder = path.join(url, '../');
    return fs.existsSync(path.join(folder, fileName)) ||
        fs.existsSync(path.join(folder, '_' + fileName)) ||
        fs.existsSync(path.join(folder, '_' + fileName + '.scss')) ||
        fs.existsSync(path.join(folder, fileName + '.scss'));
}
