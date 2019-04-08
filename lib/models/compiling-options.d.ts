import * as ts from 'typescript';
export interface CompilingOptions {
    outDir: string;
    srcDir: string;
    indexPath: string;
    tsconfigPath: string;
    cwd: string;
    compilerOptions?: ts.CompilerOptions;
    packagesFilesMap?: any;
}
