import * as ts from 'typescript';
import * as pkg from '@pikantino/pkg';
export interface CompilingOptions {
    outDir: string;
    srcDir: string;
    indexPath: string;
    tsconfigPath: string;
    cwd: string;
    compilerOptions?: ts.CompilerOptions;
    packagesFilesMap?: pkg.PackagesFilesMap;
}
