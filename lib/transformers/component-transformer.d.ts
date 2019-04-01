import { CompilerOptions } from "../models/transpile-options";
export declare function componentTransformerFactory(filePath: any, options: CompilerOptions, provideDependency: (dep: string) => void): (context: any) => (node: any) => any;
