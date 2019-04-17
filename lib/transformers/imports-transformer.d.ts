import { CompilingOptions } from "../models/compiling-options";
export declare function importsTransformerFactory(filePath: string, options: CompilingOptions, usedTypesMap: {
    [key: string]: boolean;
}): (context: any) => (node: any) => any;
