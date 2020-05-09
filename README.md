# tinyjam

A barebones, zero-configuration **static site generator** that deliberately has **no features**, an experiment in radical simplicity. Essentially a tiny glue between [EJS templates](https://ejs.co/) and [Markdown](https://spec.commonmark.org/current/) with convenient defaults, written in JavaScript.

_Experimental and a work in progress — there's no code yet, just scoping out the concepts._

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
<%- include('_header.ejs') -%>

<% for (const {date, title, url} of Object.values(posts)) { -%>
    <h3><%= date %>: <a href="<%= url %>"><%= title %></a></h3>
<% } -%>
```

## Concepts

### Data

All `*.md` and `*.yml` files inside the working directory are interpreted as **data**, available for any templates all at once. For example, given the following folder structure:

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

A template in the `posts` folder will expose data relative to it, but you can access all the other data through the `root` property:

```js
"01": ...,
"02": ...,
root: {config: ..., about: ...}
```

### Templates

- `*.ejs` files are treated as [EJS templates](https://ejs.co/) to be rendered with the collected data. EJS is a simple templating system where you can use plain JavaScript code.
- `<filename>.ejs` files are rendered as `<filename>.html`, except `_<filename>.ejs` which are skipped to be used as includes.
- If there's an `item.ejs` file in a folder, all _data_ files in this folder (e.g. `<filename>.md`) are rendered with this template as `<filename>.html`, with the variable `item` representing each file's data.
- All files other than templates and data are copied as is (`css`, `js`, `json`, etc).
- Templates are rendered as `html` by default, but you can use other extensions, e.g. `main.css.ejs` will be rendered as `main.css`.
