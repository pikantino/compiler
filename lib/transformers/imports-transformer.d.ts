import { TranspileOptions } from "../models/transpile-options";
export declare function importsTransformerFactory(filePath: string, options: TranspileOptions): (context: any) => (node: any) => any;
