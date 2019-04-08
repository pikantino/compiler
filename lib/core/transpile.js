"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs-extra");
const ts = require("typescript");
const ts_utils_1 = require("../helpers/ts-utils");
const imports_transformer_1 = require("../transformers/imports-transformer");
const error_handler_1 = require("../helpers/error-handler");
const component_transformer_1 = require("../transformers/component-transformer");
const types_transformer_1 = require("../transformers/types-transformer");
async function transpile(filePath, options) {
    const dependencies = [];
    const outFilePath = path.join(options.cwd, options.outDir, filePath).slice(0, -3) + '.js';
    const file = await fs.readFile(filePath)
        .catch((error) => error_handler_1.handleError(error, `Cannot read file ${filePath}`, new Buffer('')));
    const usedTypesMap = {};
    let result;
    try {
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
    }
    catch (error) {
        error_handler_1.handleError(error, `Cannot transpile file ${filePath}`);
    }
    ts_utils_1.printDiagnostics(result.diagnostics);
    fs.outputFile(outFilePath, result.outputText).then(() => {
        return fs.outputFile(outFilePath + '.map', result.sourceMapText)
            .catch((error) => error_handler_1.handleError(error, `Cannot write map for ${outFilePath}`, null));
    }).catch((error) => error_handler_1.handleError(error, `Cannot write output for ${outFilePath}`, null));
    return dependencies;
}
exports.transpile = transpile;
