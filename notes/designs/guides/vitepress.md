# VitePress Setup Guide

## What is VitePress?

VitePress is a documentation site generator that turns markdown files into a browsable website with search, navigation, and hot-reloading.

## Installation

1. Add VitePress to package.json dependencies:
   - Add `"vitepress": "^1.6.4"` to devDependencies
   - Add scripts:
     - `"docs:dev": "vitepress dev"`
     - `"docs:build": "vitepress build"`
     - `"docs:preview": "vitepress preview"`

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
- `srcDir: './notes/designs'` - Only look in notes/designs directory (ignores archives automatically)
- `srcExclude: []` - No additional exclusions needed
- `search: { provider: 'local' }` - Enables search

## Running

4. Start the dev server: `yarn docs:dev`
5. Open browser to the URL shown (usually http://localhost:5173)
6. Edit markdown files in notes/designs - changes appear instantly

## How It Works

- VitePress reads all `.md` files in `notes/designs`
- File paths become URLs (e.g., `guides/debugging.md` → `/guides/debugging`)
- The sidebar and nav can be configured in config.mts
- Search indexes all markdown content automatically

## To Have Claude Set This Up

Say: "Read vitepress.md and set it up"
