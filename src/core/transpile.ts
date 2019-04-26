import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';
import {ContextError} from '@pikantino/toolkit';

import {printDiagnostics} from "../helpers/ts-utils";
import {CompilingOptions} from "../models/compiling-options";
import {importsTransformerFactory} from "../transformers/imports-transformer";
import {componentTransformerFactory} from "../transformers/component-transformer";
import {typesTransformer} from "../transformers/types-transformer";

/**
 * Transpile a single .ts file and return list of its dependencies
 * @param filePath
 * @param {CompilingOptions} options
 * @returns {Promise<string[]>} List of file dependencies such as html, sass.
 */
export async function transpile(filePath, options: CompilingOptions): Promise<string[]> {
    const dependencies: string[] = [];

    const outFilePath = path.join(options.cwd, options.outDir, filePath).slice(0, -3) + '.js'; // Replace the extension

    const file: Buffer = await fs.readFile(filePath).catch((error: Error) => {
        throw new ContextError(`Cannot read file ${filePath}`, error);
    });

    const usedTypesMap: { [key: string]: boolean } = {};

    let result: ts.TranspileOutput;

    result = ts.transpileModule(file.toString(), {
        compilerOptions: options.compilerOptions,
        transformers: {
            after: [
                importsTransformerFactory(filePath, options, usedTypesMap)
            ],
            before: [
                componentTransformerFactory(filePath, options, (dep: string) =>
                    dependencies.push(dep)),
                typesTransformer(usedTypesMap)
            ]
        }
    });


    printDiagnostics(result.diagnostics);

    fs.outputFile(outFilePath, result.outputText).catch((error: Error) => {
        throw new ContextError(`Cannot write file ${outFilePath}`, error);
    });
    fs.outputFile(outFilePath + '.map', result.sourceMapText).catch((error: Error) => {
        throw new ContextError(`Cannot write map to ${outFilePath}`, error);
    });

    return dependencies;
}
