import * as path from 'path';
import * as fs from 'fs-extra';
import * as ts from 'typescript';

import {printDiagnostics} from "../helpers/ts-utils";
import {CompilerOptions} from "../models/transpile-options";
import {interfacesTransformerFactory} from "../transformers/interfaces-transformer";
import {importsTransformerFactory} from "../transformers/imports-transformer";
import {handleError} from "../helpers/error-handler";
import {componentTransformerFactory} from "../transformers/component-transformer";

export async function transpile(filePath, options: CompilerOptions): Promise<string[]> {
    const dependencies: string[] = [];

    const outFilePath = path.join(options.cwd, options.outDir, filePath).slice(0, -3) + '.js';

    const file: Buffer = await fs.readFile(filePath)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot read file ${filePath}`, new Buffer('')));


    let result: ts.TranspileOutput;

    try {
        result = ts.transpileModule(file.toString(), {
            compilerOptions: options.compilerOptions,
            transformers: {
                after: [
                    importsTransformerFactory(filePath, options)
                ],
                before: [
                    interfacesTransformerFactory(),
                    componentTransformerFactory(filePath, options, (dep: string) =>
                        dependencies.push(dep))
                ]
            }
        });
    } catch (error) {
        handleError(error, `Cannot transpile file ${filePath}`);
    }

    printDiagnostics(result.diagnostics);

    fs.outputFile(outFilePath, result.outputText).then(() => {
        return fs.outputFile(outFilePath + '.map', result.sourceMapText)
            .catch((error: NodeJS.ErrnoException) =>
                handleError(error, `Cannot write map for ${outFilePath}`, null));
    }).catch((error: NodeJS.ErrnoException) =>
        handleError(error, `Cannot write output for ${outFilePath}`, null));

    return dependencies;
}
