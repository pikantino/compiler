import { CompilingOptions } from "../models/compiling-options";
/**
 * Perform a one-time build of the project
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
declare function build(options: CompilingOptions): Promise<void>;
/**
 * Perform a build a then watch changes to re-build single file
 * @param {CompilingOptions} options
 * @returns {Promise<void>}
 */
declare function watch(options: CompilingOptions): Promise<void>;
export { watch, build };
