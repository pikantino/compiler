#! /usr/bin/env node
const pkg = require('@pikantino/pkg');
const core = require('../lib/index.js');

const argv = require('yargs')
    .describe('outDir', 'Output directory')
    .default('outDir', 'dist')
    .alias('outDir', 'o')
    .describe('srcDir', 'Sources directory')
    .default('srcDir', 'src')
    .alias('srcDir', 's')
    .describe('modules', 'Modules output directory')
    .default('modules', 'web_modules')
    .alias('modules', 'm')
    .describe('tsconfig', 'TsConfig file path')
    .default('tsconfig', 'tsconfig.json')
    .describe('index', 'Index.html file path')
    .default('index', 'index.html')
    .describe('watch', 'Watch changes and rebuild')
    .default('watch', false)
    .alias('watch', 'w')
    .help()
    .argv;

pkg.pack(argv.outDir, argv.modules).then((packagesFilesMap) => {
    const options = {
        outDir: 'dist',
        srcDir: 'src',
        cwd: process.cwd(),
        compilerOptions: {},
        tsconfigPath: argv.tsconfig,
        indexPath: argv.index,
        packagesFilesMap: packagesFilesMap
    };

    if (argv.watch) {
        core.watch(options);
    } else {
        core.build(options);
    }
});
