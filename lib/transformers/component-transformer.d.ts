import { CompilingOptions } from "../models/compiling-options";
export declare function componentTransformerFactory(filePath: any, options: CompilingOptions, provideDependency: (dep: string) => void): (context: any) => (node: any) => any;
