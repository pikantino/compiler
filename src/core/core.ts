import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as nodeWatch from 'node-watch';
import * as Progress from 'progress';
import {ContextError} from '@pikantino/toolkit';

import {CompilingOptions} from "../models/compiling-options";
import {transpile} from "./transpile";
import {processStyles} from "../helpers/styles-processor";
import {createProgressBar} from '../helpers/progress-bar';


/**
 * Perform a one-time build of the project
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function build(options: CompilingOptions): Promise<void> {
    process.on('unhandledRejection', (error: Error) => {
        throw new ContextError('Cannot compile', error);
    });

    const customOptions: CompilingOptions = await updateCompilerOptions(options).catch((error: Error) => {
        throw new ContextError('Cannot read compiler options', error);
    });
    await initialBuild(customOptions).catch((error: Error) => {
        throw new ContextError('Cannot perform initial build', error);
    });
}


/**
 * Perform a build a then watch changes to re-build single file
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function watch(options: CompilingOptions): Promise<void> {
    process.on('unhandledRejection', (error: Error) => {
        throw new ContextError('Cannot compile', error);
    });

    const customOptions: CompilingOptions = await updateCompilerOptions(options).catch((error: Error) => {
        throw new ContextError('Cannot read compiler options', error);
    });

    let dependenciesMap: { [key: string]: string } | void = await initialBuild(customOptions).catch((error: Error) => {
        throw new ContextError('Cannot perform initial build', error);
    });

    nodeWatch('./src', {recursive: true}, (event: any, filePath: string) => {
        const fileName = getFilename(filePath);

        const target: string = defineTarget(fileName, filePath, dependenciesMap as {});

        if (target) {
            console.log(`Changes in ${filePath}. Rebuilding ${target}.`);

            const rebuildingProgress: Progress = createProgressBar('Rebuilding...');

            const dependentFilePath: string = dependenciesMap[filePath];

            transpile('./' + target, customOptions).then((deps: string[]) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap as {},
                    createDependenciesMap(dependentFilePath, deps)
                ]);
                rebuildingProgress.tick();
            }).catch((error: Error) => {
                throw new ContextError(`Cannot transpile file ${target}`, error);
            })
        }
    });
}

/**
 * By fileName of file find a dependent file or return null otherwise
 * @param fileName
 * @param filePath
 * @param {Object} dependenciesMap Key-value map with all project dependencies as keys and with dependents as values
 * @returns {string} Path of the dependent file
 */
function defineTarget(fileName: string, filePath: string, dependenciesMap: { [key: string]: string }): string {
    if (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') && !fileName.endsWith('.spec.ts')) {
        return filePath;
    } else if (dependenciesMap[filePath]) {
        return dependenciesMap[filePath];
    }
    return null;
}

/**
 * Cleanup output directory
 * @param options
 * @returns {Promise<void>}
 */
async function cleanup(options: CompilingOptions): Promise<void> {
    await fs.remove(path.join(options.cwd, options.outDir, options.srcDir));
}

/**
 * Perform initial build and return dependencies map.
 * Dependencies map. Key-value map with all project dependencies as keys and with dependents as values.
 * @param {CompilingOptions} options
 * @returns {Promise<{[p: string]: string}>} Dependencies Map.
 */
async function initialBuild(options: CompilingOptions): Promise<{ [key: string]: string }> {
    await cleanup(options).catch((error: Error) => {
        throw new ContextError('Cannot cleanup', error);
    });
    await copyIndexFile(options).catch((error: Error) => {
        throw new ContextError('Cannot copy index file', error);
    });
    await copyFavicon(options).catch((error: Error) => {
        throw new ContextError('Cannot copy favicon', error);
    });
    await copyAssets(options).catch((error: Error) => {
        throw new ContextError('Cannot copy assets', error);
    });

    await buildStyles(options).catch((error: Error) => {
        throw new ContextError('Cannot build project styles', error);
    });

    const files: string[] = await locateFiles(options.srcDir).catch((error: Error) => {
        throw new ContextError(`Cannot locate files in ${options.srcDir}`, error);
    });

    const progressBar: Progress = createProgressBar('Transpiling files...', files.length);

    const dependenciesMaps: { [key: string]: string }[] =
        await Promise.all(files.map(file => {
            progressBar.render({file: file.slice(-100)});

            return transpile(file, options).then((deps: string[]) => {
                progressBar.tick();
                return createDependenciesMap(file, deps)
            }).catch((error: Error) => {
                throw new ContextError(`Cannot transpile file ${file}`, error);
            });
        }));

    return mergeDependenciesMaps(dependenciesMaps);
}

/**
 * Copy index file using file path from Compiling Options
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function copyIndexFile(options: CompilingOptions): Promise<void> {
    const htmlPath = path.join(options.srcDir, options.indexPath);
    const htmlOutPath = path.join(options.cwd, options.outDir, 'index.html');

    await fs.copy(htmlPath, htmlOutPath);
}

/**
 * Build common project styles
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function buildStyles(options: CompilingOptions): Promise<void> { // TODO styles in config
    const filePath = path.join(options.cwd, options.srcDir, 'app', 'styles', 'index.scss');
    const outFileDit = path.join(options.cwd, options.outDir, options.srcDir, 'styles.css');
    let processedStyles: string = '';

    try {
        processedStyles = processStyles(options, filePath, outFileDit);
    } catch (error) {
        throw new ContextError(`Cannot process project styles ${filePath}`, error);
    }

    await fs.outputFile(outFileDit, processedStyles);
}

/**
 * Copy project assets
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function copyAssets(options: CompilingOptions): Promise<void> { // TODO assets folder to settings
    const assetsFolderPath = path.join(options.cwd, options.srcDir, 'assets');
    const assetsDistFolderPath = path.join(options.cwd, options.outDir, options.srcDir, 'assets');
    await fs.copy(assetsFolderPath, assetsDistFolderPath);
}

/**
 * Copy favicon
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
async function copyFavicon(options: CompilingOptions): Promise<void> {
    const faviconPath = path.join(options.cwd, options.srcDir, 'favicon.ico');
    const iconExists: boolean = fs.pathExistsSync(faviconPath);

    if (iconExists) {
        fs.copySync(faviconPath, path.join(options.cwd, options.outDir, 'favicon.icon'));
    }
}

/**
 * Read tsconfig.json using path from Compiling Options and return updated Compiling Options
 * @param options
 * @returns {Promise<CompilingOptions>}
 */
async function updateCompilerOptions(options: CompilingOptions): Promise<CompilingOptions> {
    const compilerOptions: ts.CompilerOptions = await readCompilerOptions(options.cwd, options).catch((error: Error) => {
        throw new ContextError('Cannot read compiler options', error)
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
function readCompilerOptions(cwd: string, options: CompilingOptions): Promise<ts.CompilerOptions> {
    return fs.readFile(path.join(cwd, options.tsconfigPath))
        .then((file: Buffer) => {
            let compilerOptions: { [key: string]: string };
            try {
                compilerOptions = JSON.parse(file.toString());
            } catch (error) {
                throw new ContextError('Cannot parse tsconfig.json', error);
            }
            return Object.assign({},
                compilerOptions,
                options.compilerOptions,
                {
                    module: ts.ModuleKind.ES2015,
                    importHelpers: false,
                    declaration: false,
                    emitDecoratorMetadata: true,
                    experimentalDecorators: true,
                })
        });
}

/**
 * Locate all .ts files in directory
 * @param srcDir
 * @returns {Promise<string[]>} Array of absolute files
 */
function locateFiles(srcDir: string): Promise<string[]> {
    return new Promise((resolve) => {
        glob(`${srcDir}/**/!(*.spec|*.d).ts`, (error: NodeJS.ErrnoException, files: string[]) => {
            if (error) {
                throw error;
            }

            resolve(files);
        });
    })
}

/**
 * Creates flat dependencies map from dependency name and list of dependencies
 * @param file
 * @param deps
 * @returns {{[p: string]: string}} Map with dependency as key and dependent file as value
 */
function createDependenciesMap(file: string, deps: string[]): { [key: string]: string } {
    const map: { [key: string]: string } = {};

    deps.forEach((dep: string) => map[dep] = file);

    return map;
}

/**
 * Merge dependency maps
 * @param maps
 * @returns {any}
 */
function mergeDependenciesMaps(maps: { [key: string]: string }[]): { [key: string]: string } {
    return Object.assign.apply({}, maps);
}

/**
 * Get filename from filePath
 * @param filePath
 * @returns {string} Name if the file
 */
function getFilename(filePath: string): string {
    const blocks = filePath.split('/');
    return blocks[blocks.length - 1];
}

export {watch, build};
