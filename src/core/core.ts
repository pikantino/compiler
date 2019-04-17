import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as nodeWatch from 'node-watch';

import {CompilingOptions} from "../models/compiling-options";
import {transpile} from "./transpile";
import {handleError} from "../helpers/error-handler";
import {createProgressBar} from "../helpers/create-progress-bar";
import * as ProgressBar from 'progress';
import {Emitter, Progress} from "../helpers/emitter";
import {processStyles} from "../helpers/styles-processor";

async function initialBuild(options: CompilingOptions): Promise<void> {
    const customOptions: CompilingOptions = await updateCompilerOptions(options);
    await build(customOptions);
}

async function cleanup(options: CompilingOptions): Promise<void> {
    await fs.remove(path.join(options.cwd, options.outDir, options.srcDir));
}

async function build(options: CompilingOptions): Promise<{ [key: string]: string }> {
    await cleanup(options);

    copyIndexFile(options);
    copyFavicon(options);
    copyAssets(options);

    buildStyles(options);

    const files: string[] = await locateFiles(options.srcDir)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot locate files in ${options.srcDir}`));

    // const progress: ProgressBar = createProgressBar(files.length, 'Transpiling files...');
    const progress: Progress = new Progress('Transpiling files...', 'Done', files.length);

    const dependenciesMaps: { [key: string]: string }[] =
        await Promise.all(files.map(file => {
            return transpile(file, options)
                .then((deps: string[]) => {
                    progress.tick(file.slice(-100));
                    return createDependenciesMap(file, deps)
                });
        }));

    return mergeDependenciesMaps(dependenciesMaps); // TODO add styles and html as dependencies map
}

async function watch(options: CompilingOptions): Promise<void> {
    const customOptions: CompilingOptions = await updateCompilerOptions(options);

    let dependenciesMap: { [key: string]: string } = await build(customOptions);

    nodeWatch('./src', {recursive: true}, (event: any, filePath: string) => {
        const fileName = getFilename(filePath);

        if (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') && !fileName.endsWith('.spec.ts')) {
            const emitter: Emitter = new Emitter(`Changes in ${filePath}. Rebuilding...`);

            transpile('./' + filePath, customOptions).then((deps: string[]) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(filePath, deps)
                ]);
                emitter.done();
            });
        } else if (dependenciesMap[filePath]) {
            const emitter: Emitter = new Emitter(`Changes in ${filePath}. Rebuilding...`);

            const dependentFilePath: string = dependenciesMap[filePath];

            transpile('./' + dependentFilePath, customOptions).then((deps: string[]) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(dependentFilePath, deps)
                ]);
                emitter.done();
            });
        }
    });
}

function copyIndexFile(options: CompilingOptions): void {
    const htmlPath = path.join(options.srcDir, options.indexPath);
    const htmlOutPath = path.join(options.cwd, options.outDir, 'index.html');

    fs.copy(htmlPath, htmlOutPath)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot copy index.html`, null));
}

async function buildStyles(options: CompilingOptions): Promise<void> { // TODO styles in config
    const filePath = path.join(options.cwd, options.srcDir, 'app', 'styles', 'index.scss');
    const outFileDit = path.join(options.cwd, options.outDir, options.srcDir, 'styles.css');

    fs.outputFileSync(outFileDit, processStyles(options, filePath, outFileDit));
}

function copyAssets(options: CompilingOptions): void { // TODO assets folder to settings
    const assetsFolderPath = path.join(options.cwd, options.srcDir, 'assets');
    const assetsDistFolderPath = path.join(options.cwd, options.outDir, options.srcDir, 'assets');
    fs.copy(assetsFolderPath, assetsDistFolderPath)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot copy assets folder`, null));
}

async function copyFavicon(options: CompilingOptions): Promise<void> {
    const faviconPath = path.join(options.cwd, options.srcDir, 'favicon.ico');
    const iconExists: boolean = await fs.pathExists(faviconPath);

    if (iconExists) {
        fs.copy(faviconPath, path.join(options.cwd, options.outDir, 'favicon.icon'));
    }
}

async function updateCompilerOptions(options: CompilingOptions): Promise<CompilingOptions> {
    const compilerOptions: ts.CompilerOptions = await readCompilerOptions(options.cwd, options)
        .catch((error: NodeJS.ErrnoException) => handleError(error, 'Cannot read tsconfig.json', {}));
    return {
        ...options,
        compilerOptions
    };
}

function readCompilerOptions(cwd: string, options: CompilingOptions): Promise<ts.CompilerOptions> {
    return fs.readFile(path.join(cwd, options.tsconfigPath))
        .then((file: Buffer) => {
            return Object.assign({},
                JSON.parse(file.toString()).compilerOptions,
                options.compilerOptions,
                {module: ts.ModuleKind.ES2015})
        });
}

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

function createDependenciesMap(file: string, deps: string[]): { [key: string]: string } {
    const map: { [key: string]: string } = {};

    deps.forEach((dep: string) => map[dep] = file);

    return map;
}

function mergeDependenciesMaps(maps: { [key: string]: string }[]): { [key: string]: string } {
    return Object.assign.apply({}, maps);
}

function getFilename(filePath: string): string {
    const blocks = filePath.split('/');
    return blocks[blocks.length - 1];
}

export {watch, initialBuild as build};
