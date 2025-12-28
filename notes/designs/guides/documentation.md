# Documentation

## Viewing Markdown Files in Browser

This project uses VitePress to provide a documentation website for browsing all markdown files in a web browser.

### Starting the Documentation Server

To start the docs server, just run:

```bash
yarn docs:dev
```

That's it! Yarn will handle everything. The server will start at http://localhost:5174/ (or another port if 5174 is busy).

### Other Commands

- `yarn docs:build` - Build the static site
- `yarn docs:preview` - Preview the built site

No need for any NVM commands - yarn takes care of using the correct Node version automatically.

### What's Included

The documentation site includes:
- A home page with links to all major documentation sections
- Sidebar navigation organized by:
  - Guides
  - Architecture
  - Analysis
  - Next/Future
  - Archives
- Local search functionality
- Hot-reload support (changes to markdown files appear immediately)

### Configuration

The VitePress configuration is located at `.vitepress/config.mts` and can be customized to add more navigation items, change the theme, or adjust other settings.
