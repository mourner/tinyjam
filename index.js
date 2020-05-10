'use strict';

const fs = require('fs');
const {join, basename, dirname, extname, relative} = require('path');

const ejs = require('ejs');
const fm = require('front-matter');
const marked = require('marked');
const yaml = require('js-yaml');

module.exports = tinyjam;

function tinyjam(src, dest, options = {}) {
    fs.mkdirSync(dest, {recursive: true});

    const markedOptions = {
        breaks: options.breaks,
        smartypants: options.smartypants
    };

    const proto = {}; // TODO custom helpers?
    const root = Object.create(proto);
    proto.root = root;

    const templates = [];

    walk(src, root);

    for (const {template, data: localData, dir, name, ext, isCollection} of templates) {
        if (isCollection) {
            for (const key of Object.keys(localData)) {
                const path = join(dir, key) + ext;
                console.log(`rendering \t${path}`);
                const out = template(localData[key]);
                fs.writeFileSync(join(dest, path), out);
            }
        } else {
            const path = join(dir, name) + ext;
            console.log(`rendering \t${path}`);
            const out = template(localData);
            fs.writeFileSync(join(dest, path), out);
        }
    }

    function walk(dir, data) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const path = join(dir, file);
            if (relative(path, dest) === '') continue;

            const shortPath = relative(src, path);
            const ext = extname(path);
            const name = basename(path, ext);

            if (file[0] === '.' || file === 'node_modules' || ext === '.lock' || name.endsWith('-lock')) {
                console.log(`skipping \t${shortPath}`);
                continue;
            }

            const stats = fs.lstatSync(path);

            if (stats.isDirectory()) {
                fs.mkdirSync(join(dest, shortPath), {recursive: true});
                data[file] = Object.create(proto);
                walk(path, data[file]);
                continue;
            }

            if (ext === '.md') {
                console.log(`reading \t${shortPath} (markdown)`);
                const {attributes, body} = fm(fs.readFileSync(path, 'utf8'));

                if (attributes.body !== undefined)
                    throw new Error('Can\'t use reserved keyword "body" as a front matter property.');

                data[name] = {...attributes, body: marked(body, markedOptions)};

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
                    dir: dirname(shortPath),
                    name,
                    ext: outExt,
                    path: join(dirname(shortPath), name) + outExt,
                    data,
                    isCollection
                });

            } else {
                console.log(`copying \t${shortPath} (static)`);
                fs.copyFileSync(path, join(dest, shortPath));
            }
        }
    }
}
