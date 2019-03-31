import * as ts from 'typescript';
import * as pkg from '@pikantino/pkg';
export interface TranspileOptions {
    outDir: string;
    srcDir: string;
    cwd: string;
    compilerOptions?: ts.CompilerOptions;
    packagesFilesMap?: pkg.PackagesFilesMap;
}
