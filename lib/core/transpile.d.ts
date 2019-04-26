import { CompilingOptions } from "../models/compiling-options";
/**
 * Transpile a single .ts file and return list of its dependencies
 * @param filePath
 * @param {CompilingOptions} options
 * @returns {Promise<string[]>} List of file dependencies such as html, sass.
 */
export declare function transpile(filePath: any, options: CompilingOptions): Promise<string[]>;
