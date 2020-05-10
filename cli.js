'use strict';

const tinyjam = require('./index.js');

if (process.argv.length < 4) {
    console.log('Usage: tinyjam <source_dir> <output_dir>');

} else {
    const src = process.argv[2];
    const out = process.argv[3];

    console.time('tinyjam');
    tinyjam(src, out);
    console.timeEnd('tinyjam');
}
