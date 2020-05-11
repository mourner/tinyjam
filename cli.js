#!/usr/bin/env node
'use strict';

const tinyjam = require('./index.js');
const {version} = require('./package.json');
const {performance} = require('perf_hooks');

console.log(`tinyjam v${version}`);

if (process.argv.length < 4) {
    console.log('usage: tinyjam <source_dir> <output_dir>');

} else {
    console.log('');
    const start = performance.now();

    const src = process.argv[2];
    const out = process.argv[3];
    tinyjam(src, out);

    const elapsed = performance.now() - start;
    console.log(`\nDone in ${elapsed.toLocaleString()}ms.`);
}
