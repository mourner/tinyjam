'use strict';

const ejs = require('ejs');
const fs = require('fs');
const {join, basename, dirname, extname, relative} = require('path');

const fm = require('front-matter');
const marked = require('marked');
const yaml = require('js-yaml');

module.exports = tinyjam;

function tinyjam(src, dest) {
    const proto = {}; // TODO custom helpers?
    const root = Object.create(proto);
    proto.root = root;

    const templates = [];

    walk(src, root);

    for (const {template, data: localData, path, isCollection} of templates) {
        if (isCollection) {
            for (const key in localData) {
                if (key === 'root') continue;
                console.log(`rendering \t${path} (${key})`);
                const out = template(localData[key]);
                // TODO write file
            }
        } else {
            console.log(`rendering \t${path}`);
            const out = template(localData);
            // TODO write file
        }
    }

    function walk(dir, data) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const path = join(dir, file);
            const shortPath = relative(src, path);
            const stats = fs.lstatSync(path);

            if (stats.isDirectory()) {
                data[file] = Object.create(proto);
                walk(path, data[file]);
                // TODO create output dir
                continue;
            }

            const ext = extname(path);
            const name = basename(path, ext);

            if (ext === '.md') {
                console.log(`reading \t${shortPath} (markdown)`);
                const {attributes, body} = fm(fs.readFileSync(path, 'utf8'));

                if (attributes.body !== undefined)
                    throw new Error('Can\'t use reserved keyword "body" as a front matter property.');

                data[name] = {...attributes, body: marked(body)};

            } else if (ext === '.yml' || ext === '.yaml') {
                console.log(`reading \t${shortPath} (yaml)`);
                data[name] = yaml.safeLoad(fs.readFileSync(path, 'utf8'));

            } else if (ext === '.ejs') {
                if (name[0] === '_') {
                    console.log(`skipping \t${shortPath} (include)`);
                    continue; // skip includes
                }

                console.log(`compiling \t${shortPath} (template)`);
                const outExt = extname(name) ? '' : '.html';
                const src = fs.readFileSync(path, 'utf8');
                const template = ejs.compile(src, {filename: path});
                const isCollection = name === 'item';
                templates.push({
                    template,
                    path: join(dirname(shortPath), name) + outExt,
                    data,
                    isCollection
                });

            } else {
                console.log(`copying \t${shortPath} (static)`);
                // TODO copy over the rest
            }
        }
    }
}
