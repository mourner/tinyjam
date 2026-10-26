import fs from 'fs';
import {join, basename, dirname, extname, relative} from 'path';

import {compile} from 'yeahjs';
import {marked} from 'marked';
import {parse as parseYaml} from '@mourner/yeahml';

const defaultOptions = {
    log: false,
    breaks: false
};

export default function tinyjam(src, dest = src, options = {}) {
    options = Object.assign({}, defaultOptions, options);

    // Markdown renderer options
    const markedOptions = {breaks: options.breaks};

    const proto = {};
    const root = createCtx('.'); // root data object
    proto.root = root; // add data root access to all leaf nodes

    const templates = [];
    const dirs = new WeakSet(); // folder data objects, which aren't collection items
    const cache = {}; // include cache

    fs.mkdirSync(dest, {recursive: true}); // make sure destination exists

    walk(src, root); // process files, collect data and templates to render

    // render templates; we do it later to make sure all data is collected first
    for (const {ejs, path, data, dir, name, ext, isCollection} of templates) {
        if (isCollection) {
            for (const key of Object.keys(data)) {
                if (key[0] !== '_' && !dirs.has(data[key])) render(ejs, path, data[key], dir, key, ext);
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
        const template = compile(ejs, {
            locals: [...new Set(Object.keys(data).filter(isLocal).concat(['root', 'rootPath']))],
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

    // recursively walk through and process files inside the source directory;
    // `_`-prefixed files and folders are source only: their data is read, but nothing is output from them
    function walk(dir, data, sourceOnly = false) {
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
            const hidden = sourceOnly || file[0] === '_';

            if (stats.isDirectory()) {
                if (!hidden) fs.mkdirSync(destPath, {recursive: true});
                data[file] = createCtx(join(rootPath, '..'));
                dirs.add(data[file]);
                walk(path, data[file], hidden);
                continue;
            }

            if (ext === '.md') {
                log(`read    ${shortPath}`);
                const {body, attributes} = parseFrontMatter(fs.readFileSync(path, 'utf8'));

                data[name] = createCtx(rootPath, {...attributes, body: marked(body, markedOptions)});

            } else if (ext === '.yml' || ext === '.yaml') {
                log(`read    ${shortPath}`);
                data[name] = createCtx(rootPath, parseYaml(fs.readFileSync(path, 'utf8')));

            } else if (hidden) {
                log(`skip    ${shortPath}`);

            } else if (ext === '.ejs') {
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

// data keys that can't be template variables (they stay reachable as `locals[key]`): non-identifiers,
// strict mode reserved words, and names yeahjs uses in compiled templates
const identRe = /^[\p{ID_Start}$_][\p{ID_Continue}$‌‍]*$/u;
const reserved = new Set(('break case catch class const continue debugger default delete do else enum export extends ' +
    'false finally for function if import in instanceof new null return super switch this throw true try typeof var ' +
    'void while with yield let static implements interface package private protected public await eval arguments ' +
    'locals _esc _str _out').split(' '));

function isLocal(key) {
    return identRe.test(key) && !reserved.has(key);
}

const fmOpen = '---';
const fmClose = '\n---';

function parseFrontMatter(str) {
    // A leading BOM is not content. It pushed the opening fence off column 0.
    if (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
    if (str.indexOf(fmOpen) !== 0 || str[fmOpen.length] === fmOpen[0]) return {body: str};

    let close = str.indexOf(fmClose, fmOpen.length);
    if (close < 0) close = str.length;

    const attributes = parseYaml(str.slice(0, close));
    if (attributes.body !== undefined)
        throw new Error('Can\'t use reserved keyword "body" as a front matter property.');

    const body = str.slice(close + fmClose.length, str.length);
    return {body, attributes};
}
