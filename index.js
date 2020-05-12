'use strict';

const fs = require('fs');
const {join, basename, dirname, extname, relative} = require('path');

const ejs = require('ejs');
const fm = require('front-matter');
const marked = require('marked');
const yaml = require('js-yaml');

module.exports = tinyjam;

const defaultOptions = {
    log: false,
    breaks: false,
    smartypants: false,
    highlight: null
};

function tinyjam(src, dest, options = {}) {
    options = Object.assign({}, defaultOptions, options);

    // Markdown renderer options
    const {breaks, smartypants, highlight} = options;
    const markedOptions = {breaks, smartypants, highlight, smartLists: true};

    const proto = {};
    const root = createCtx('.'); // root data object
    proto.root = root; // add data root access to all leaf nodes

    const templates = [];

    fs.mkdirSync(dest, {recursive: true}); // make sure destination exists

    walk(src, root); // process files, collect data and templates to render

    // render templates; we do it later to make sure all data is collected first
    for (const {template, data, dir, name, ext, isCollection} of templates) {
        if (isCollection) {
            for (const key of Object.keys(data)) {
                render(template, data[key], dir, key, ext);
            }
        } else {
            render(template, data, dir, name, ext);
        }
    }

    function log(msg) {
        if (options.log) console.log(msg);
    }

    function render(template, data, dir, name, ext) {
        const path = join(dir, name) + ext;
        log(`render  ${path}`);
        fs.writeFileSync(join(dest, path), template(data));
    }

    // create an object to be used as evalulation data in a template
    function createCtx(rootPath, properties) {
        // prototype magic to make sure all data objects have access to root/rootPath
        // in templates and includes, and without them being returned in Object.keys
        const ctxProto = Object.create(proto);
        ctxProto.rootPath = rootPath;
        const ctx = Object.create(ctxProto);
        if (properties) Object.assign(ctx, properties);
        return ctx;
    }

    // recursively walk through and process files inside the source directory
    function walk(dir, data) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const path = join(dir, file);
            if (relative(path, dest) === '') continue;

            const shortPath = relative(src, path);
            const ext = extname(path);
            const name = basename(path, ext);
            const rootPath = relative(dirname(shortPath), '');

            if (file[0] === '.' || file === 'node_modules' || ext === '.lock' || name.endsWith('-lock')) {
                log(`skip    ${shortPath}`);
                continue;
            }

            const stats = fs.lstatSync(path);

            if (stats.isDirectory()) {
                fs.mkdirSync(join(dest, shortPath), {recursive: true});
                data[file] = createCtx(join(rootPath, '..'));
                walk(path, data[file]);
                continue;
            }

            if (ext === '.md') {
                log(`read    ${shortPath}`);
                const {attributes, body} = fm(fs.readFileSync(path, 'utf8'));

                if (attributes.body !== undefined)
                    throw new Error('Can\'t use reserved keyword "body" as a front matter property.');

                data[name] = createCtx(rootPath, {...attributes, body: marked(body, markedOptions)});

            } else if (ext === '.yml' || ext === '.yaml') {
                log(`read    ${shortPath}`);
                data[name] = createCtx(rootPath, yaml.safeLoad(fs.readFileSync(path, 'utf8')));

            } else if (ext === '.ejs') {
                if (name[0] === '_') { // skip includes
                    log(`skip    ${shortPath}`);
                    continue;
                }
                log(`compile ${shortPath}`);
                templates.push({
                    data,
                    name,
                    template: ejs.compile(fs.readFileSync(path, 'utf8'), {filename: path}),
                    isCollection: name === 'item',
                    dir: dirname(shortPath),
                    ext: extname(name) ? '' : '.html'
                });

            } else {
                log(`copy    ${shortPath}`);
                fs.copyFileSync(path, join(dest, shortPath));
            }
        }
    }
}
