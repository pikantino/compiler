import { TranspileOptions } from "../models/transpile-options";
export declare function componentTransformerFactory(filePath: any, options: TranspileOptions, provideDependency: (dep: string) => void): (context: any) => (node: any) => any;
