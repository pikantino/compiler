import { CompilingOptions } from "../models/compiling-options";
declare function initialBuild(options: CompilingOptions): Promise<void>;
declare function watch(options: CompilingOptions): Promise<void>;
export { watch, initialBuild as build };
