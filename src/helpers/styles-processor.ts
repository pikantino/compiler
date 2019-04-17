import * as sass from 'node-sass';
import * as postcss from 'postcss';
import * as postcssUrl from 'postcss-url';
import * as path from "path";
import * as fs from 'fs';

import {CompilingOptions} from "../models/compiling-options";

export function processStyles(options: CompilingOptions, filePath: string, rebasedPath: string): string {
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

function getImporter(options: CompilingOptions): (url: string, prev: string) => { file: string } {
    return (url: string, prev: string): { file: string } => {
        let resolvedUrl: string = url;
        if (url.startsWith('~')) {
            const withoutTilde = url.slice(1);
            if (isImportExists(path.join(options.cwd, withoutTilde))) {
                resolvedUrl = path.join(options.cwd, withoutTilde);
            } else {
                resolvedUrl = path.join(options.cwd, 'node_modules', withoutTilde);
            }
        }

        return {
            file: resolvedUrl
        };
    }
}

function isImportExists(url: string): boolean {
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    const folder = path.join(url, '../');

    return fs.existsSync(path.join(folder, fileName)) ||
        fs.existsSync(path.join(folder, '_' + fileName)) ||
        fs.existsSync(path.join(folder, '_' + fileName + '.scss')) ||
        fs.existsSync(path.join(folder, fileName + '.scss'));
}
