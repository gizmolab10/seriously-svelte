import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Webseriously Documentation",
  description: "Project documentation and design notes",
  srcDir: './notes/designs',
  srcExclude: ['obsolete/**', 'next/**'],

  vite: {
    server: {
      port: 5176
    }
  },

  themeConfig: {

    sidebar: [
      {
        text: 'Home',
        collapsed: true,
        items: [
          { text: 'Project', link: '/readme' },
          { text: 'Documentation', link: '/documentation' }
        ]
      },
      {
        text: 'Architecture',
        collapsed: true,
        items: [
          { text: 'Bubble', link: '/architecture/bubble' },
          { text: 'Buttons', link: '/architecture/buttons' },
          { text: 'Components', link: '/architecture/components' },
          { text: 'Controls', link: '/architecture/controls' },
          { text: 'Database', link: '/architecture/database' },
          { text: 'Details', link: '/architecture/details' },
          { text: 'Hits', link: '/architecture/hits' },
          { text: 'Paging', link: '/architecture/paging' },
          { text: 'Preferences', link: '/architecture/preferences' },
          { text: 'Search', link: '/architecture/search' },
          { text: 'State', link: '/architecture/state' },
          { text: 'Styles', link: '/architecture/styles' },
          { text: 'UX', link: '/architecture/ux' },
          { text: 'Writables', link: '/architecture/writables' }
        ]
      },
      {
        text: 'Guides',
        collapsed: true,
        items: [
          { text: 'Debugging', link: '/guides/debugging' },
          { text: 'Documentation', link: '/guides/documentation' },
          { text: 'Gotchas', link: '/guides/gotchas' },
          { text: 'Markdown', link: '/guides/markdown' },
          { text: 'Refactoring', link: '/guides/refactoring' },
          { text: 'Style Guide', link: '/guides/style' }
        ]
      },
      {
        text: 'Analysis',
        collapsed: true,
        items: [
          { text: 'Breadcrumbs', link: '/analysis/breadcrumbs' },
          { text: 'Focus', link: '/analysis/focus' },
          { text: 'Geometry', link: '/analysis/geometry' },
          { text: 'Layout Guide', link: '/analysis/refactor-layout' },
          { text: 'Refactor Clicks', link: '/analysis/refactor-clicks' },
          { text: 'Timers', link: '/analysis/timers' },
          { text: 'Widget Title', link: '/analysis/widget_title' }
        ]
      }
    ],

    search: {
      provider: 'local'
    }
  }
})
