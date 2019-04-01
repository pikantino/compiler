"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const nodeWatch = require("node-watch");
const transpile_1 = require("./transpile");
const error_handler_1 = require("../helpers/error-handler");
async function initialBuild(options) {
    const customOptions = await updateCompilerOptions(options);
    await build(customOptions);
}
exports.build = initialBuild;
async function build(options) {
    copyIndexFile(options);
    const files = await locateFiles(options.srcDir)
        .catch((error) => error_handler_1.handleError(error, `Cannot locate files in ${options.srcDir}`));
    const dependenciesMaps = await Promise.all(files.map(file => transpile_1.transpile(file, options)
        .then((deps) => createDependenciesMap(file, deps))));
    return mergeDependenciesMaps(dependenciesMaps);
}
async function watch(options) {
    const customOptions = await updateCompilerOptions(options);
    let dependenciesMap = await build(customOptions);
    nodeWatch('./src', { recursive: true }, (event, filePath) => {
        const fileName = getFilename(filePath);
        if (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') && !fileName.endsWith('.spec.ts')) {
            console.log(`Changes in ${filePath}. Rebuilding...`);
            transpile_1.transpile('./' + filePath, customOptions).then((deps) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(filePath, deps)
                ]);
            });
        }
        else if (dependenciesMap[filePath]) {
            const dependentFilePath = dependenciesMap[filePath];
            console.log(`Changes in ${filePath}. Rebuilding ${dependentFilePath}...`);
            transpile_1.transpile('./' + dependentFilePath, customOptions).then((deps) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(dependentFilePath, deps)
                ]);
            });
        }
    });
}
exports.watch = watch;
function copyIndexFile(options) {
    const htmlPath = path.join(options.srcDir, options.indexPath);
    const htmlOutPath = path.join(options.cwd, options.outDir, 'index.html');
    fs.copy(htmlPath, htmlOutPath)
        .catch((error) => error_handler_1.handleError(error, `Cannot copy index.html`, null));
}
async function updateCompilerOptions(options) {
    const compilerOptions = await readCompilerOptions(options.cwd, options)
        .catch((error) => error_handler_1.handleError(error, 'Cannot read tsconfig.json', {}));
    return {
        ...options,
        compilerOptions
    };
}
function readCompilerOptions(cwd, options) {
    return fs.readFile(path.join(cwd, options.tsconfigPath))
        .then((file) => {
        return Object.assign({}, JSON.parse(file.toString()).compilerOptions, options.compilerOptions, { module: ts.ModuleKind.ES2015 });
    });
}
function locateFiles(srcDir) {
    return new Promise((resolve) => {
        glob(`${srcDir}/**/!(*.spec|*.d).ts`, (error, files) => {
            if (error) {
                throw error;
            }
            resolve(files);
        });
    });
}
function createDependenciesMap(file, deps) {
    const map = {};
    deps.forEach((dep) => map[dep] = file);
    return map;
}
function mergeDependenciesMaps(maps) {
    return Object.assign.apply({}, maps);
}
function getFilename(filePath) {
    const blocks = filePath.split('/');
    return blocks[blocks.length - 1];
}
