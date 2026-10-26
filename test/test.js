
import fs from 'fs';
import os from 'os';
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

test('front matter with a UTF-8 BOM', () => {
    const src = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    const dest = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    fs.writeFileSync(join(src, 'about.md'), '\uFEFF---\ntitle: Hello\n---\nWorld.\n');
    fs.writeFileSync(join(src, 'index.ejs'), 'TITLE:<%= about.title %>\nBODY:<%- about.body %>');
    tinyjam(src, dest);
    const html = fs.readFileSync(join(dest, 'index.html'), 'utf8');
    assert.equal(html, 'TITLE:Hello\nBODY:<p>World.</p>\n');
    rimraf.sync(src);
    rimraf.sync(dest);
});

test('front matter keys that are not valid template variables', () => {
    const src = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    const dest = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    fs.writeFileSync(join(src, 'a.md'), '---\nauthor-url: http://a\nclass: x\n_out: y\nroot: z\nnaïve: w\n---\n');
    fs.writeFileSync(join(src, 'item.ejs'), '<%= locals["author-url"] %> <%= locals.class %> <%= locals._out %> <%= root %> <%= naïve %>');
    tinyjam(src, dest);
    assert.equal(fs.readFileSync(join(dest, 'a.html'), 'utf8'), 'http://a x y z w');
    rimraf.sync(src);
    rimraf.sync(dest);
});

test('item.ejs skips subfolders', () => {
    const src = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    const dest = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    fs.mkdirSync(join(src, 'img'));
    fs.writeFileSync(join(src, 'img', 'a.png'), '');
    fs.writeFileSync(join(src, 'post.md'), '---\ntitle: Post\n---\n');
    fs.writeFileSync(join(src, 'item.ejs'), '<%= title.toUpperCase() %>');
    tinyjam(src, dest);
    assert.equal(fs.readFileSync(join(dest, 'post.html'), 'utf8'), 'POST');
    assert.ok(!fs.existsSync(join(dest, 'img.html')));
    rimraf.sync(src);
    rimraf.sync(dest);
});

function testDir(input, expected) {
    const inputPath = join(fixturesDir, input);
    const expectedPath = join(fixturesDir, expected);
    const actualPath = `${expectedPath}_actual`;

    rimraf.sync(actualPath);

    tinyjam(inputPath, actualPath);

    const result = dircompare.compareSync(actualPath, expectedPath, {compareContent: true});
    assert.ok(result.same, `folders different: ${JSON.stringify(result.diffSet.filter(r => r.reason), null, 2)}`);
}
