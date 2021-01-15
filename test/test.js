
import {test} from 'tape';
import dircompare from 'dir-compare';
import rimraf from 'rimraf';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import tinyjam from '../index.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('example', t => testDir(t, '../../example', 'example_output'));
test('test', t => testDir(t, 'test_input', 'test_output'));

function testDir(t, input, expected) {
    const inputPath = join(fixturesDir, input);
    const expectedPath = join(fixturesDir, expected);
    const actualPath = `${expectedPath}_actual`;

    rimraf.sync(actualPath);

    tinyjam(inputPath, actualPath);

    const result = dircompare.compareSync(actualPath, expectedPath, {compareContent: true});
    if (result.same) {
        t.pass('folders equal');
        rimraf.sync(actualPath);
    } else {
        console.error(result.diffSet.filter(r => r.reason));
        t.fail('folders different');
    }

    t.end();
}
