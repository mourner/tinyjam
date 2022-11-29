<h1 align="center">tinyjam</h1>

<p align="center"><img src="https://raw.githubusercontent.com/mourner/tinyjam/master/tinyjam.png" width="262">

A bare-bones, zero-configuration **static site generator** that deliberately has **no features**, an experiment in radical simplicity. Essentially a tiny, elegant glue between [EJS templates](https://github.com/mourner/yeahjs) and [Markdown](https://github.github.com/gfm/) with freeform structure (enabling incremental adoption) and convenient defaults, written in under 120 lines of JavaScript.

[![Build Status](https://github.com/mourner/tinyjam/workflows/Node/badge.svg?branch=master)](https://github.com/mourner/tinyjam/actions)
[![Install Size](https://packagephobia.now.sh/badge?p=tinyjam)](https://packagephobia.now.sh/result?p=tinyjam)
[![Simply Awesome](https://img.shields.io/badge/simply-awesome-brightgreen.svg)](https://github.com/mourner/projects)

- [Example](#example)
- [Documentation](#documentation)
    - [Getting started](#getting-started)
    - [Data files](#data-files)
    - [Templates](#templates)
    - [Command line](#command-line)
    - [Node.js API](#nodejs-api)
- [FAQ](#faq)

## Example

```bash
# source directory
├── posts
│   ├── 01.md
│   ├── 02.md
│   └── item.ejs
├── _header.ejs
└── index.ejs

# output
├── posts
│   ├── 01.html
│   └── 02.html
└── index.html
```

An example template:

```ejs
<%- include('_header.ejs') %>

<% for (const [name, {date, title}] of Object.entries(posts)) { %>
    <h3><%= date.toDateString() %>: <a href="posts/<%= name %>.html"><%= title %></a></h3>
<% } %>
```

Browse the [full example](example/) and see the [generated website](https://mourner.github.io/tinyjam/test/fixtures/example_output/).

## Documentation

### Getting started

```bash
npx tinyjam source_dir output_dir
```

**Tinyjam** doesn't impose any folder structure, processing any data files (`*.md` and `*.yml`) and templates (`*.ejs`) it encounters and copying over anything else.

### Data files

All `*.md` and `*.yml` files inside the working directory are interpreted as **data**, available for any templates all at once as JavaScript objects. For example, given the following folder structure:

```
├── posts
│   ├── 01.md
│   ├── 02.md
├── data.yml
└── about.md
```

A template in this folder will have the contents available as:

```js
posts: {
  "01": {title: "First post", date: new Date("2020-02-20"), body: "Hello world"},
  "02": {title: "Second post", date: new Date("2020-02-21"), body: "Hello there"}
},
data: {author: "Vladimir Agafonkin"},
about: {body: "This is an awesome blog about me."}
```

Markdown is rendered according to the [GitHub Flavored Markdown](https://github.github.com/gfm/) specification.

### Templates

**Tinyjam** uses EJS (through [yeahjs](https://github.com/mourner/yeahjs), a fast EJS subset), a templating system where you can use plain JavaScript, so it's both powerful and easy to learn. All `*.ejs` files it encounters are rendered with the collected data in the following way:

- `<filename>.ejs` files are rendered as `<filename>.html`.
- `item.ejs` has a special meaning: all _data files_ in the same folder (e.g. `<filename>.md`) are rendered with this template as `<filename>.html` with the corresponding file's data.
- Templates starting with `_` (e.g. `_header.ejs`) are skipped (to be used as EJS includes).
- Templates are rendered as `html` by default, but you can use other extensions, e.g. `main.css.ejs` will be rendered as `main.css`.

In addition to the collected data, templates have access to the following properties:

- `rootPath` is a relative path to the root of the project — useful as a prefix for links in includes as they may be used on different nesting levels (e.g. `<%= rootPath %>/index.css`).
- `root` references all of the project's data, which is useful for accessing data in includes or outside of the current template's folder.
- `destPath` is a relative path to the current output file, which is useful for canonical links (e.g. `<link rel="canonical" href="<%= root.data.baseUrl + '/' + destPath %>">`>).

### Command line

Install with NPM to use `tinyjam` as a CLI: `npm install -g tinyjam`. Usage:

```
tinyjam source_dir [output_dir] [--breaks] [--smartypants] [--silent]
```

- `--breaks`: Add single line breaks as `<br>` in Markdown.
- `--smartypants`: Convert quotes, dashes and ellipses in Markdown to typographic equivalents.
- `--silent`: Run silently (unless there's an error).

If `output_dir` is not provided, it's assumed equal to `source_dir`. This is useful for incrementally converting static sites without changing deployment folders.

### Node.js API

```js
import tinyjam from 'tinyjam';

tinyjam(sourceDir, outputDir, {
    log: false,         // log the progress (like in the CLI)
    breaks: false,      // Markdown: add single line breaks (like in GitHub comments)
    smartypants: false, // Markdown: convert quotes, dashes and ellipses to typographic equivalents
    highlight: null     // a code highlighting function: (code, lang) => html
});
````

Note that the project only supports Node v12.17+.

## FAQ

#### Why build yet another static site generator?

I wanted to add some templating to my personal static websites to make them easier to maintain (e.g. [my band's album page](https://rain.in.ua/son/en), which is pure HTML/CSS/JS), but never found a static site generator that would be simple and unobtrusive enough for my liking.

A tool I envisioned would not involve meticulous configuration, special folder structure, reading through hundreds of documentation pages, bringing in a ton of dependencies, or making you learn a new language. At the same time, it would be flexible enough to make multilingual websites without plugins and convoluted setup.

Ideally, I would just rename some `html` files to `ejs`, move some content to Markdown files, add light templating and be done with it. So I decided to build my own minimal tool for this, but will be happy if anyone else finds it useful.

#### Can you add \<feature X\>?

Sorry — probably not, unless it fits the concept of a minimal, zero-configuration tool.

#### How fast is Tinyjam?

Pretty fast. I didn't see a point in benchmarking because most of the time is spent parsing Markdown/YAML and rendering EJS anyway, but corresponding dependencies (`marked`, `js-yaml`, `yeahjs`) are very well optimized.

#### Why EJS for templating, and can I use another templating system?

EJS is also an extremely simple, minimal system, and it allows you to use plain JavaScript for templates, making it pretty powerful with almost no learning curve. To make it even faster, I crafted my own implementation ([yeahjs](https://github.com/mourner/yeahjs)). No plans to support other template engines.

#### How do I make a reactive single-page app with dynamic routing, hydration, bundle splitting and service worker caching?

There's no need for all that in a static website. If you do have a case for it, you'll need a different tool.

#### How do I make a multilingual website?

**Tinyjam** gives you freedom to approach this in many different ways, but here's an example:

```ejs
en.ejs: <%- include('_content.ejs', {lang: 'en'}) %>
fr.ejs: <%- include('_content.ejs', {lang: 'fr'}) %>
_content.ejs: <%= content[lang].body %> (use either content/en.md or content/fr.md)
```

#### How do I add pagination?

At the moment, you can't. It's not a great UI pattern anyway — make an archive page with links to all content instead.

#### How do I do asset optimization, CSS preprocessing, TypeScript transpilation, etc.?

Do all the preprocessing in the source directory prior to running `tinyjam`.

#### How do I add code syntax highlighting?

Here's an example using the `tinyjam` API with [highlight.js](https://highlightjs.org/):

```js
import tinyjam from 'tinyjam';
import {highlight} from 'highlight.js';

tinyjam(sourceDir, outputDir, {
    highlight: (code, lang) => highlight(lang, code).value
});
```
