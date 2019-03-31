import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as glob from 'glob';
import * as nodeWatch from 'node-watch';

import {TranspileOptions} from "../models/transpile-options";
import {transpile} from "./transpile";
import {handleError} from "../helpers/error-handler";

async function initialBuild(options: TranspileOptions): Promise<void> {
    const customOptions: TranspileOptions = await updateCompilerOptions(options);
    await build(customOptions);
}

async function build(options: TranspileOptions): Promise<{ [key: string]: string }> {
    copyIndexFile(options.srcDir, options.outDir, options.cwd);

    const files: string[] = await locateFiles(options.srcDir)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot locate files in ${options.srcDir}`));

    const dependenciesMaps: { [key: string]: string }[] =
        await Promise.all(files.map(file =>
            transpile(file, options).then((deps: string[]) => createDependenciesMap(file, deps))));

    return mergeDependenciesMaps(dependenciesMaps);
}

async function watch(options: TranspileOptions): Promise<void> {
    const customOptions: TranspileOptions = await updateCompilerOptions(options);

    console.log(customOptions);

    let dependenciesMap: { [key: string]: string } = await build(customOptions);

    nodeWatch('./src', {recursive: true}, (event: any, filePath: string) => {
        const fileName = getFilename(filePath);

        if (fileName.endsWith('.ts') && !fileName.endsWith('.d.ts') && !fileName.endsWith('.spec.ts')) {
            console.log(`Changes in ${filePath}. Rebuilding...`);

            transpile('./' + filePath, customOptions).then((deps: string[]) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(filePath, deps)
                ]);
            });
        } else if (dependenciesMap[filePath]) {
            const dependentFilePath: string = dependenciesMap[filePath];

            console.log(`Changes in ${filePath}. Rebuilding ${dependentFilePath}...`);

            transpile('./' + dependentFilePath, customOptions).then((deps: string[]) => {
                dependenciesMap = mergeDependenciesMaps([
                    dependenciesMap,
                    createDependenciesMap(dependentFilePath, deps)
                ]);
            });
        }
    });
}

function copyIndexFile(srcDir: string, outDir: string, cwd: string): void {
    const htmlPath = path.join(srcDir, 'index.html');
    const htmlOutPath = path.join(cwd, outDir, 'index.html');

    fs.copy(htmlPath, htmlOutPath)
        .catch((error: NodeJS.ErrnoException) =>
            handleError(error, `Cannot copy index.html`, null));
}

async function updateCompilerOptions(options: TranspileOptions): Promise<TranspileOptions> {
    const compilerOptions: ts.CompilerOptions = await readCompilerOptions(options.cwd, options.compilerOptions)
        .catch((error: NodeJS.ErrnoException) => handleError(error, 'Cannot read tslint.json', {}));
    return {
        ...options,
        compilerOptions
    };
}

function readCompilerOptions(cwd: string, customOptions: ts.CompilerOptions): Promise<ts.CompilerOptions> {
    return fs.readFile(path.join(cwd, './tsconfig.json'))
        .then((file: Buffer) => {
            return Object.assign({},
                JSON.parse(file.toString()).compilerOptions,
                customOptions,
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
