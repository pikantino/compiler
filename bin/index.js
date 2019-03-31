#! /usr/bin/env node
const pkg = require('@pikantino/pkg');
const watch = require('../lib/index.js').watch;

pkg.pack().then((packagesFilesMap) => {
    watch({
        outDir: 'dist',
        srcDir: 'src',
        cwd: process.cwd(),
        compilerOptions: {},
        packagesFilesMap: packagesFilesMap
    });
});
