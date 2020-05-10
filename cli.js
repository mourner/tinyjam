'use strict';

const tinyjam = require('./index.js');

const src = process.argv[2];
const dst = process.argv[3];

tinyjam(src, dst);
