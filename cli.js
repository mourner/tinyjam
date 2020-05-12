#!/usr/bin/env node
'use strict';

const tinyjam = require('./index.js');
const {version} = require('./package.json');
const {performance} = require('perf_hooks');

if (process.argv.length < 3) {
    console.log(`tinyjam v${version}`);
    console.log('usage: tinyjam source_dir [output_dir] [--breaks] [--smartypants] [--silent]');

} else {
    const [src, out] = process.argv.slice(2).filter(s => !s.startsWith('--'));
    const breaks = process.argv.includes('--breaks');
    const smartypants = process.argv.includes('--smartypants');
    const log = !process.argv.includes('--silent');

    if (log) console.log(`tinyjam v${version}\n`);

    const start = performance.now();
    tinyjam(src, out, {log, breaks, smartypants});
    const elapsed = performance.now() - start;

    if (log) console.log(`\nDone in ${elapsed.toLocaleString()}ms.`);
}
