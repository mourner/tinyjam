
import test from 'node:test';
import assert from 'node:assert/strict';
import dircompare from 'dir-compare';
import {rimraf} from 'rimraf';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import tinyjam from '../index.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('example', () => testDir('../../example', 'example_output'));
test('test', () => testDir('test_input', 'test_output'));

function testDir(input, expected) {
    const inputPath = join(fixturesDir, input);
    const expectedPath = join(fixturesDir, expected);
    const actualPath = `${expectedPath}_actual`;

    rimraf.sync(actualPath);

    tinyjam(inputPath, actualPath);

    const result = dircompare.compareSync(actualPath, expectedPath, {compareContent: true});
    assert.ok(result.same, `folders different: ${result.diffSet.filter(r => r.reason)}`);
}
