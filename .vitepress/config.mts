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
      { text: 'Introduction', link: '/readme' },
      { text: 'Documentation', link: '/documentation' },
      {
        text: 'Architecture',
        collapsed: true,
        items: [
          { text: 'Breadcrumbs', link: '/architecture/breadcrumbs' },
          { text: 'Bubble', link: '/architecture/bubble' },
          { text: 'Buttons', link: '/architecture/buttons' },
          { text: 'Components', link: '/architecture/components' },
          { text: 'Controls', link: '/architecture/controls' },
          { text: 'Database', link: '/architecture/database' },
          { text: 'Details', link: '/architecture/details' },
          { text: 'Geometry', link: '/architecture/geometry' },
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
          { text: 'Instructions', link: '/guides/instructions' },
          { text: 'Markdown', link: '/guides/markdown' },
          { text: 'Refactoring', link: '/guides/refactoring' },
          { text: 'Style Guide', link: '/guides/style' },
          { text: 'VitePress', link: '/guides/vitepress' },
          { text: 'Voice', link: '/guides/voice' },
        ]
      },
      {
        text: 'Refactor',
        collapsed: true,
        items: [
          { text: 'Breadcrumbs', link: '/refactor/breadcrumbs' },
          { text: 'Clicks', link: '/refactor/clicks' },
          { text: 'Composition', link: '/refactor/composition' },
          { text: 'Layout', link: '/refactor/layout' },
        ]
      },
      {
        text: 'Analysis',
        collapsed: true,
        items: [
          { text: 'Focus', link: '/analysis/focus' },
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
