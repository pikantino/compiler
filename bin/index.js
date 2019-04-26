#! /usr/bin/env node
const pkg = require('@pikantino/pkg');
const core = require('../lib/index.js');
const toolkit = require('@pikantino/toolkit');

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
    .describe('index', 'Index.html file path relative to your src folder')
    .default('index', 'index.html')
    .alias('index', 'i')
    .describe('watch', 'Watch changes and rebuild')
    .alias('watch', 'w')
    .describe('plugins', 'Plugins')
    .alias('plugins', 'p')
    .default('plugins', '')
    .help()
    .argv;


pkg.pack(argv.outDir, argv.modules, toolkit.loadPluginsFromString(argv.plugins))
    .then((packagesFilesMap) => {
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
