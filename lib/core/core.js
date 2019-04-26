"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const nodeWatch = require("node-watch");
const toolkit_1 = require("@pikantino/toolkit");
const transpile_1 = require("./transpile");
const styles_processor_1 = require("../helpers/styles-processor");
const progress_bar_1 = require("../helpers/progress-bar");
/**
 * Perform a one-time build of the project
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function build(options) {
    process.on('unhandledRejection', (error) => {
        throw new toolkit_1.ContextError('Cannot compile', error);
    });
    const customOptions = await updateCompilerOptions(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot read compiler options', error);
    });
    await initialBuild(customOptions).catch((error) => {
        throw new toolkit_1.ContextError('Cannot perform initial build', error);
    });
}
exports.build = build;
/**
 * Perform a build a then watch changes to re-build single file
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function watch(options) {
    process.on('unhandledRejection', (error) => {
        throw new toolkit_1.ContextError('Cannot compile', error);
    });
    const customOptions = await updateCompilerOptions(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot read compiler options', error);
    });
    let dependenciesMap = await initialBuild(customOptions).catch((error) => {
        throw new toolkit_1.ContextError('Cannot perform initial build', error);
    });
    nodeWatch('./src', { recursive: true }, (event, filePath) => {
        const fileName = getFilename(filePath);
        const target = defineTarget(fileName, filePath, dependenciesMap);
        if (target) {
            console.log(`Changes in ${filePath}. Rebuilding ${target}.`);
            const rebuildingProgress = progress_bar_1.createProgressBar('Rebuilding...');
            const dependentFilePath = dependenciesMap[filePath];
            transpile_1.transpile('./' + target, customOptions).then((deps) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(dependentFilePath, deps)
                ]);
                rebuildingProgress.tick();
            }).catch((error) => {
                throw new toolkit_1.ContextError(`Cannot transpile file ${target}`, error);
            });
        }
    });
}
exports.watch = watch;
/**
 * By fileName of file find a dependent file or return null otherwise
 * @param fileName
 * @param filePath
 * @param {Object} dependenciesMap Key-value map with all project dependencies as keys and with dependents as values
 * @returns {string} Path of the dependent file
 */
function defineTarget(fileName, filePath, dependenciesMap) {
    if (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') && !fileName.endsWith('.spec.ts')) {
        return filePath;
    }
    else if (dependenciesMap[filePath]) {
        return dependenciesMap[filePath];
    }
    return null;
}
/**
 * Cleanup output directory
 * @param options
 * @returns {Promise<void>}
 */
async function cleanup(options) {
    await fs.remove(path.join(options.cwd, options.outDir, options.srcDir));
}
/**
 * Perform initial build and return dependencies map.
 * Dependencies map. Key-value map with all project dependencies as keys and with dependents as values.
 * @param {CompilingOptions} options
 * @returns {Promise<{[p: string]: string}>} Dependencies Map.
 */
async function initialBuild(options) {
    await cleanup(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot cleanup', error);
    });
    await copyIndexFile(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot copy index file', error);
    });
    await copyFavicon(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot copy favicon', error);
    });
    await copyAssets(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot copy assets', error);
    });
    await buildStyles(options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot build project styles', error);
    });
    const files = await locateFiles(options.srcDir).catch((error) => {
        throw new toolkit_1.ContextError(`Cannot locate files in ${options.srcDir}`, error);
    });
    const progressBar = progress_bar_1.createProgressBar('Transpiling files...', files.length);
    const dependenciesMaps = await Promise.all(files.map(file => {
        progressBar.render({ file: file.slice(-100) });
        return transpile_1.transpile(file, options).then((deps) => {
            progressBar.tick();
            return createDependenciesMap(file, deps);
        }).catch((error) => {
            throw new toolkit_1.ContextError(`Cannot transpile file ${file}`, error);
        });
    }));
    return mergeDependenciesMaps(dependenciesMaps);
}
/**
 * Copy index file using file path from Compiling Options
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function copyIndexFile(options) {
    const htmlPath = path.join(options.srcDir, options.indexPath);
    const htmlOutPath = path.join(options.cwd, options.outDir, 'index.html');
    await fs.copy(htmlPath, htmlOutPath);
}
/**
 * Build common project styles
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function buildStyles(options) {
    const filePath = path.join(options.cwd, options.srcDir, 'app', 'styles', 'index.scss');
    const outFileDit = path.join(options.cwd, options.outDir, options.srcDir, 'styles.css');
    let processedStyles = '';
    try {
        processedStyles = styles_processor_1.processStyles(options, filePath, outFileDit);
    }
    catch (error) {
        throw new toolkit_1.ContextError(`Cannot process project styles ${filePath}`, error);
    }
    await fs.outputFile(outFileDit, processedStyles);
}
/**
 * Copy project assets
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function copyAssets(options) {
    const assetsFolderPath = path.join(options.cwd, options.srcDir, 'assets');
    const assetsDistFolderPath = path.join(options.cwd, options.outDir, options.srcDir, 'assets');
    await fs.copy(assetsFolderPath, assetsDistFolderPath);
}
/**
 * Copy favicon
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function copyFavicon(options) {
    const faviconPath = path.join(options.cwd, options.srcDir, 'favicon.ico');
    const iconExists = fs.pathExistsSync(faviconPath);
    if (iconExists) {
        fs.copySync(faviconPath, path.join(options.cwd, options.outDir, 'favicon.icon'));
    }
}
/**
 * Read tsconfig.json using path from Compiling Options and return updated Compiling Options
 * @param options
 * @returns {Promise<CompilingOptions>}
 */
async function updateCompilerOptions(options) {
    const compilerOptions = await readCompilerOptions(options.cwd, options).catch((error) => {
        throw new toolkit_1.ContextError('Cannot read compiler options', error);
    });
    return {
        ...options,
        compilerOptions
    };
}
/**
 * Read tsconfig.json using path from Compiling Options and return it as JS object with pre-set module type
 * @param cwd
 * @param options
 * @returns {Promise<{}>}
 */
function readCompilerOptions(cwd, options) {
    return fs.readFile(path.join(cwd, options.tsconfigPath))
        .then((file) => {
        let compilerOptions;
        try {
            compilerOptions = JSON.parse(file.toString());
        }
        catch (error) {
            throw new toolkit_1.ContextError('Cannot parse tsconfig.json', error);
        }
        return Object.assign({}, compilerOptions, options.compilerOptions, {
            module: ts.ModuleKind.ES2015,
            importHelpers: false,
            declaration: false,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
        });
    });
}
/**
 * Locate all .ts files in directory
 * @param srcDir
 * @returns {Promise<string[]>} Array of absolute files
 */
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
/**
 * Creates flat dependencies map from dependency name and list of dependencies
 * @param file
 * @param deps
 * @returns {{[p: string]: string}} Map with dependency as key and dependent file as value
 */
function createDependenciesMap(file, deps) {
    const map = {};
    deps.forEach((dep) => map[dep] = file);
    return map;
}
/**
 * Merge dependency maps
 * @param maps
 * @returns {any}
 */
function mergeDependenciesMaps(maps) {
    return Object.assign.apply({}, maps);
}
/**
 * Get filename from filePath
 * @param filePath
 * @returns {string} Name if the file
 */
function getFilename(filePath) {
    const blocks = filePath.split('/');
    return blocks[blocks.length - 1];
}
