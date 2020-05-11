
const {test} = require('tape');
const dircompare = require('dir-compare');
const rimraf = require('rimraf');
const {join} = require('path');

const tinyjam = require('../index.js');

test('example', (t) => {
    const inputPath = join(__dirname, '../example');
    const expectedPath = join(__dirname, 'fixtures/example_output');
    const actualPath = join(__dirname, 'fixtures/example_actual');

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
});
