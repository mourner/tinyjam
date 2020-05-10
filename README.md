# tinyjam

A barebones, zero-configuration **static site generator** that deliberately has **no features**, an experiment in radical simplicity. Essentially a tiny glue between [EJS templates](https://ejs.co/) and [Markdown](https://spec.commonmark.org/current/) with freeform structure and convenient defaults, written in JavaScript.

_Experimental and a work in progress — the code doesn't work yet._

[![Simply Awesome](https://img.shields.io/badge/simply-awesome-brightgreen.svg)](https://github.com/mourner/projects)

## [Example](example/)

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

<% for (const {date, title, url} of Object.values(posts)) { %>
    <h3><%= date %>: <a href="<%= url %>"><%= title %></a></h3>
<% } %>
```

## Concepts

**Tinyjam** doesn't impose any folder structure, processing any data files (`*.md` and `*.yml`) and templates (`*.ejs`) it encounters and copying over anything else.

### Data files

All `*.md` and `*.yml` files inside the working directory are interpreted as **data**, available for any templates all at once as JSON objects. For example, given the following folder structure:

```
├── posts
│   ├── 01.md
│   ├── 02.md
├── config.yml
└── about.md
```

A template in this folder will have the contents available as:

```js
posts: {
  "01": {title: "First post", date: "2020-02-20", body: ...},
  "02": ...
},
config: {foo: "bar"},
about: ...
```

Although a template is evaluated with the data alongside it (inside the same directory), you can access all of the project's data through the `root` property (e.g. a template inside `posts` could access `root.config`).

### Templates

- `*.ejs` files are treated as [EJS templates](https://ejs.co/) to be rendered with the collected data. EJS is a simple templating system where you can use plain JavaScript code.
- `<filename>.ejs` files are rendered as `<filename>.html`, except `_<filename>.ejs` which are skipped (to be used as includes).
- If there's a file named `item.ejs` in a folder, all _data files_ in this folder (e.g. `<filename>.md`) are rendered with this template as `<filename>.html` with the corresponding file's data.
- Templates are rendered as `html` by default, but you can use other extensions, e.g. `main.css.ejs` will be rendered as `main.css`.

## FAQ

#### Why build yet another static site generator?

I wanted to add some templating to my personal static websites like [my band's album page](https://rain.in.ua/son/en) (currently in pure HTML/CSS) to make them easier to maintain, but never found a static site generator that would be simple and unobtrusive enough for my liking — not requiring meticulous configuration, special folder structure, reading through hundreds of documentation pages, bringing in a ton of dependencies, or making you learn a new language; and be flexible enough to make multilingual websites without plugins and convoluted setup.

Ideally, I would just rename some `html` files to `ejs`, move some content to Markdown files, add light templating and be done with it. So I decided to build my own minimal tool for this, but will be happy if anyone else finds it useful.

#### Can you add \<feature X\>?

Sorry — probably not, unless it fits the concept of a minimal, zero-configuration tool.

#### Why EJS for templating, and can I use another templating system?

EJS is also an extremely simple, minimal system, and it allows you to use plain JavaScript for templates, making it pretty powerful with almost no learning curve. No plans to support other template engines.
