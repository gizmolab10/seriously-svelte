# VitePress: Publishing Web Documentation

I asked the AI to write instructions for installing, configuring and running vitepress in a way that I could understand it and it could read it and do it.

## Viewing Markdown Files in Browser

This project uses VitePress to provide a documentation website for browsing all markdown files in a web browser.

### Starting the Documentation Server

To start the docs server, just run:

```bash
yarn docs:dev
```

That's it! Yarn will handle everything. The server will start on port 5176 (or another port if 5176 is busy).

### Other Commands

* `yarn docs:build` - Build the static site
* `yarn docs:preview` - Preview the built site

No need for any NVM commands - yarn takes care of using the correct Node version automatically.

### What's Included

The documentation site includes:

* A home page with links to all major documentation sections
* Sidebar navigation organized by:
  * Guides
  * Architecture
  * Analysis
  * Next/Future
  * Archives
* Local search functionality
* Hot-reload support (changes to markdown files appear immediately)

### Configuration

The VitePress configuration is located at `.vitepress/config.mts` and can be customized to add more navigation items, change the theme, or adjust other settings.


---

# VitePress Setup Guide

## What is VitePress?

VitePress is a documentation site generator that turns markdown files into a browsable website with search, navigation, and hot-reloading.

## Installation


1. Add VitePress to package.json dependencies:
   * Add `"vitepress": "^1.6.4"` to devDependencies
   * Add scripts:
     * `"docs:dev": "vitepress dev"`
     * `"docs:build": "vitepress build"`
     * `"docs:preview": "vitepress preview"`
2. Run `yarn install` to install VitePress

## Configuration


3. Create `.vitepress/config.mts` in the project root with this content:

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "webseriously docs",
  description: "Project documentation and design notes",
  srcDir: './notes/designs',
  srcExclude: [],

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' }
    ],

    sidebar: [],

    search: {
      provider: 'local'
    }
  }
})
```

Key settings:

* `srcDir: './notes/designs'` - Only look in notes/designs directory (ignores archives automatically)
* `srcExclude: []` - No additional exclusions needed
* `search: { provider: 'local' }` - Enables search

## Running


4. Start the dev server: `yarn docs:dev`
5. Open browser to the URL shown (usually on port 5176)
6. Edit markdown files in notes/designs - changes appear instantly

## How It Works

* VitePress reads all `.md` files in `notes/designs`
* File paths become URLs (e.g., `guides/debugging.md` → `/guides/debugging`)
* The sidebar and nav can be configured in config.mts
* Search indexes all markdown content automatically

## Adding a Favicon

To add a favicon (icon in browser tab) to your VitePress site:


1. **Add the icon file** to `.vitepress/public/`
   * Example: `.vitepress/public/favicon.png`
   * Recommended size: 32x32 or 16x16 pixels
2. **Update config** to reference the icon in `.vitepress/config.mts`:

   ```typescript
   export default defineConfig({
     title: "webseriously docs",
     description: "Project documentation and design notes",
     
     head: [
       ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }]
     ],
     
     // ... rest of config
   })
   ```
3. **Fix VitePress bug** - VitePress doesn't copy files from public to dist during build

   Update your build script in `package.json`:

   ```json
   "docs:build": "vitepress build > vitepress.build.txt 2>&1 && cp .vitepress/public/favicon.png .vitepress/dist/"
   ```
4. **Important notes**:
   * The `head` config works in **build mode only**, not dev mode
   * Dev server (`docs:dev`) won't show the favicon due to a VitePress config loading bug
   * To test locally: run `npm run docs:build && npm run docs:preview`
   * Production deployments work fine since they use the build
   * Browsers aggressively cache favicons - use incognito/private mode to test

## To Have Claude Set This Up

Say: "Read vitepress.md and set it up"