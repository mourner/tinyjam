import fs from 'fs';
import os from 'os';
import test from 'node:test';
import assert from 'node:assert/strict';
import {rimraf} from 'rimraf';
import {join, dirname} from 'path';
import {fileURLToPath} from 'url';

import tinyjam from '../index.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

// run with `npm test -- --update` to regenerate expected outputs after an intentional change
const update = process.argv.includes('--update');

test('example', t => testDir(t, '../../example', 'example_output'));
test('test', t => testDir(t, 'test_input', 'test_output'));

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
    fs.writeFileSync(join(src, '%.ejs'), '<%= locals["author-url"] %> <%= locals.class %> <%= locals._out %> <%= root %> <%= naïve %>');
    tinyjam(src, dest);
    assert.equal(fs.readFileSync(join(dest, 'a.html'), 'utf8'), 'http://a x y z w');
    rimraf.sync(src);
    rimraf.sync(dest);
});

test('%.ejs renders each Markdown file, skipping data and subfolders', () => {
    const src = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    const dest = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    fs.mkdirSync(join(src, 'img'));
    fs.writeFileSync(join(src, 'img', 'a.png'), '');
    fs.writeFileSync(join(src, 'post.md'), '---\ntitle: Post\n---\n');
    fs.writeFileSync(join(src, 'data.yml'), 'author: Me');
    fs.writeFileSync(join(src, '%.ejs'), '<%= title.toUpperCase() %>');
    fs.writeFileSync(join(src, '%.json.ejs'), '{"title": "<%= title %>"}');
    tinyjam(src, dest);
    assert.equal(fs.readFileSync(join(dest, 'post.html'), 'utf8'), 'POST');
    assert.equal(fs.readFileSync(join(dest, 'post.json'), 'utf8'), '{"title": "Post"}');
    assert.deepEqual(fs.readdirSync(dest).sort(), ['img', 'post.html', 'post.json']);
    rimraf.sync(src);
    rimraf.sync(dest);
});

test('_-prefixed files and folders are source only', () => {
    const src = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    const dest = fs.mkdtempSync(join(os.tmpdir(), 'tinyjam-'));
    fs.mkdirSync(join(src, '_lib', 'sub'), {recursive: true});
    fs.writeFileSync(join(src, '_lib', 'part.html'), '');
    fs.writeFileSync(join(src, '_lib', 'page.ejs'), '');
    fs.writeFileSync(join(src, '_lib', 'sub', 'authors.yml'), 'name: Vlad');
    fs.writeFileSync(join(src, '_logo.png'), '');
    fs.writeFileSync(join(src, '_draft.md'), '---\ntitle: Draft\n---\n');
    fs.writeFileSync(join(src, 'post.md'), '---\ntitle: Post\n---\n');
    fs.writeFileSync(join(src, '%.ejs'), '<%= title %> <%= root._lib.sub.authors.name %> <%= root._draft.title %>');
    tinyjam(src, dest);
    assert.deepEqual(fs.readdirSync(dest), ['post.html']);
    assert.equal(fs.readFileSync(join(dest, 'post.html'), 'utf8'), 'Post Vlad Draft');
    rimraf.sync(src);
    rimraf.sync(dest);
});

async function testDir(t, input, expected) {
    const inputPath = join(fixturesDir, input);
    const expectedPath = join(fixturesDir, expected);
    const actualPath = update ? expectedPath : `${expectedPath}_actual`;

    rimraf.sync(actualPath);

    tinyjam(inputPath, actualPath);

    const files = listFiles(actualPath);
    assert.deepEqual(files, listFiles(expectedPath), 'output file list is different');

    // a subtest per file, so a failure shows its name and a line diff
    await Promise.all(files.map(file => t.test(file, () => {
        assert.equal(fs.readFileSync(join(actualPath, file), 'utf8'), fs.readFileSync(join(expectedPath, file), 'utf8'));
    })));
}

function listFiles(dir) {
    return fs.readdirSync(dir, {recursive: true}).filter(file => fs.statSync(join(dir, file)).isFile()).sort();
}
