#!/usr/bin/env node

import tinyjam from './index.js';
import {readFileSync} from 'fs';
import {parseArgs} from 'util';

const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version;
const usage = 'usage: tinyjam source_dir [output_dir] [--breaks] [--silent]';

const {values: {breaks, silent}, positionals: [src, out]} = parseArgs({
    options: {
        breaks: {type: 'boolean', default: false},
        silent: {type: 'boolean', default: false}
    },
    allowPositionals: true
});

if (!src) {
    console.log(`tinyjam v${version}`);
    console.log(usage);

} else {
    const log = !silent;

    if (log) console.log(`tinyjam v${version}\n`);

    const start = performance.now();
    tinyjam(src, out, {log, breaks});
    const elapsed = performance.now() - start;

    if (log) console.log(`\nDone in ${elapsed.toLocaleString()}ms.`);
}
