import { TranspileOptions } from "../models/transpile-options";
declare function initialBuild(options: TranspileOptions): Promise<void>;
declare function watch(options: TranspileOptions): Promise<void>;
export { watch, initialBuild as build };
