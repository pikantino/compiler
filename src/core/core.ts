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
import {Emitter} from "../helpers/emitter";

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

    const files: string[] = await locateFiles(options.srcDir)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot locate files in ${options.srcDir}`));

    const progress: ProgressBar = createProgressBar(files.length, 'Transpiling files...');

    const dependenciesMaps: { [key: string]: string }[] =
        await Promise.all(files.map(file =>
            transpile(file, options)
                .then((deps: string[]) => {
                    progress.tick();
                    return createDependenciesMap(file, deps)
                })));

    return mergeDependenciesMaps(dependenciesMaps);
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
