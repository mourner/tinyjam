import fs from 'fs';
import {join, basename, dirname, extname, relative} from 'path';

import {compile} from 'yeahjs';
import {marked} from 'marked';
import yaml from 'js-yaml';

const defaultOptions = {
    log: false,
    breaks: false,
    smartypants: false,
    highlight: null
};

export default function tinyjam(src, dest = src, options = {}) {
    options = Object.assign({}, defaultOptions, options);

    // Markdown renderer options
    const {breaks, smartypants, highlight} = options;
    const markedOptions = {breaks, smartypants, highlight, smartLists: true};

    const proto = {};
    const root = createCtx('.'); // root data object
    proto.root = root; // add data root access to all leaf nodes

    const templates = [];
    const cache = {}; // include cache

    fs.mkdirSync(dest, {recursive: true}); // make sure destination exists

    walk(src, root); // process files, collect data and templates to render

    // render templates; we do it later to make sure all data is collected first
    for (const {ejs, path, data, dir, name, ext, isCollection} of templates) {
        if (isCollection) {
            for (const key of Object.keys(data)) {
                render(ejs, path, data[key], dir, key, ext);
            }
        } else {
            render(ejs, path, data, dir, name, ext);
        }
    }

    function log(msg) {
        if (options.log) console.log(msg);
    }

    function render(ejs, filename, data, dir, name, ext) {
        const path = join(dir, name) + ext;
        data.destPath = path;
        const template = compile(ejs, {
            locals: Object.keys(data).concat(['root', 'rootPath']),
            filename, read, resolve, cache
        });
        log(`render  ${path}`);
        fs.writeFileSync(join(dest, path), template(data));
    }

    function resolve(parent, filename) {
        return join(dirname(parent), filename);
    }

    function read(filename) {
        return fs.readFileSync(filename, 'utf8');
    }

    // create an object to be used as evalulation data in a template
    function createCtx(rootPath, properties) {
        // prototype magic to make sure all data objects have access to root/rootPath
        // in templates and includes without them being enumerable
        const ctx = Object.create(proto, {rootPath: {value: rootPath, enumerable: false}});
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
            const destPath = join(dest, shortPath);

            if (file[0] === '.' || file === 'node_modules' || ext === '.lock' || name.endsWith('-lock')) {
                log(`skip    ${shortPath}`);
                continue;
            }

            const stats = fs.lstatSync(path);

            if (stats.isDirectory()) {
                fs.mkdirSync(destPath, {recursive: true});
                data[file] = createCtx(join(rootPath, '..'));
                walk(path, data[file]);
                continue;
            }

            if (ext === '.md') {
                log(`read    ${shortPath}`);
                const {body, attributes} = parseFrontMatter(fs.readFileSync(path, 'utf8'));

                data[name] = createCtx(rootPath, {...attributes, body: marked(body, markedOptions)});

            } else if (ext === '.yml' || ext === '.yaml') {
                log(`read    ${shortPath}`);
                data[name] = createCtx(rootPath, yaml.load(fs.readFileSync(path, 'utf8')));

            } else if (ext === '.ejs') {
                if (name[0] === '_') { // skip includes
                    log(`skip    ${shortPath}`);
                    continue;
                }
                log(`compile ${shortPath}`);
                templates.push({
                    data,
                    name,
                    path,
                    ejs: fs.readFileSync(path, 'utf8'),
                    isCollection: name === 'item',
                    dir: dirname(shortPath),
                    ext: extname(name) ? '' : '.html'
                });

            } else if (path !== destPath) {
                log(`copy    ${shortPath}`);
                fs.copyFileSync(path, destPath);
            }
        }
    }
}

const fmOpen = '---';
const fmClose = '\n---';

function parseFrontMatter(str) {
    if (str.indexOf(fmOpen) !== 0 || str[fmOpen.length] === fmOpen[0]) return {body: str};

    let close = str.indexOf(fmClose, fmOpen.length);
    if (close < 0) close = str.length;

    const attributes = yaml.load(str.slice(0, close));
    if (attributes.body !== undefined)
        throw new Error('Can\'t use reserved keyword "body" as a front matter property.');

    const body = str.slice(close + fmClose.length, str.length);
    return {body, attributes};
}
