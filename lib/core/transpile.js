"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const ts = require("typescript");
const toolkit_1 = require("@pikantino/toolkit");
const ts_utils_1 = require("../helpers/ts-utils");
const imports_transformer_1 = require("../transformers/imports-transformer");
const component_transformer_1 = require("../transformers/component-transformer");
const types_transformer_1 = require("../transformers/types-transformer");
/**
 * Transpile a single .ts file and return list of its dependencies
 * @param filePath
 * @param {CompilingOptions} options
 * @returns {Promise<string[]>} List of file dependencies such as html, sass.
 */
async function transpile(filePath, options) {
    const dependencies = [];
    const outFilePath = path.join(options.cwd, options.outDir, filePath).slice(0, -3) + '.js'; // Replace the extension
    const file = await fs.readFile(filePath).catch((error) => {
        throw new toolkit_1.ContextError(`Cannot read file ${filePath}`, error);
    });
    const usedTypesMap = {};
    let result;
    result = ts.transpileModule(file.toString(), {
        compilerOptions: options.compilerOptions,
        transformers: {
            after: [
                imports_transformer_1.importsTransformerFactory(filePath, options, usedTypesMap)
            ],
            before: [
                component_transformer_1.componentTransformerFactory(filePath, options, (dep) => dependencies.push(dep)),
                types_transformer_1.typesTransformer(usedTypesMap)
            ]
        }
    });
    ts_utils_1.printDiagnostics(result.diagnostics);
    fs.outputFile(outFilePath, result.outputText).catch((error) => {
        throw new toolkit_1.ContextError(`Cannot write file ${outFilePath}`, error);
    });
    fs.outputFile(outFilePath + '.map', result.sourceMapText).catch((error) => {
        throw new toolkit_1.ContextError(`Cannot write map to ${outFilePath}`, error);
    });
    return dependencies;
}
exports.transpile = transpile;
