# VitePress

i asked the AI to write instructions for installing, configuring and running vitepress in a way that i could understand it and it could read it and do it.

## Quick Start

```bash
yarn docs:dev    # start server on port 5176
yarn docs:build  # build static site
yarn docs:preview # preview built site
```

No NVM needed - yarn handles Node version.

### Tool Scripts

Run from `/notes/tools`:

```bash
./update-docs.sh  # full workflow: compile TS, sync indexes, build, fix links, gen db, sync sidebar
./reset-docs.sh   # rebuild and restart dev server (logs to reset-docs-log.txt)
```

## Setup


1. Add to package.json devDependencies: `"vitepress": "^1.6.4"`
2. Add scripts: `docs:dev`, `docs:build`, `docs:preview`
3. Create `.vitepress/config.mts` - see actual file for config
4. `yarn install`

Config lives at `.vitepress/config.mts`. Key settings:

* `srcDir: './notes/designs'` - markdown source
* `srcExclude: ['obsolete/**', 'next/**']` - skip these
* `search: { provider: 'local' }` - enables search

## Customizations

### Prev/Next in Navbar

Moved prev/next navigation from bottom of page to top navbar (before the light/dark toggle). Files involved:

* `Layout.vue` - wraps default, injects PrevNext into `nav-bar-content-after` slot
* `PrevNext.vue` - renders ← → arrows using VitePress's `usePrevNext` composable
* `custom.css` - hides original footer pager, reorders navbar elements via flex order

### Sidebar Toggle

VitePress has a `watchPostEffect` that auto-expands sections containing the active page. Can't fight Vue reactivity directly. Solution: CSS layer on top.

**The trick:** `data-user-collapsed` and `data-user-expanded` attributes. CSS uses `!important` to override VitePress styles. JS manages the attributes, localStorage persists state.

When user clicks a heading:

* Expanded → add `data-user-collapsed`, visually collapse
* Collapsed → add `data-user-expanded`, visually expand

VitePress still thinks it controls state. We just override the visuals.

Files:

* `index.ts` - click handler, localStorage read/write, applies state on load/route change
* `custom.css` - `[data-user-collapsed] > .items { display: none !important }` etc.

Also hid the carets entirely since headings now toggle on click.

## Favicon


1. Put icon in `.vitepress/public/favicon.png`
2. Add to config: `head: [['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]]`
3. Fix build: `"docs:build": "vitepress build && cp .vitepress/public/favicon.png .vitepress/dist/"`

Note: favicon only works in build mode, not dev. VitePress bug.

## To Have Claude Set This Up

Say: "Read vitepress.md and set it up"