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
          { text: 'Bubble', link: '/architecture/other/bubble' },
          { text: 'Documentation', link: '/architecture/other/documentation' },
          {
            text: 'Core',
            collapsed: true,
            items: [
              { text: 'Components', link: '/architecture/core/components' },
              { text: 'Databases', link: '/architecture/core/databases' },
              { text: 'Geometry', link: '/architecture/core/geometry' },
              { text: 'Hits', link: '/architecture/core/hits' },
              { text: 'Managers', link: '/architecture/core/managers' },
              { text: 'Persistable', link: '/architecture/core/persistable' },
              { text: 'State', link: '/architecture/core/state' },
              { text: 'Styles', link: '/architecture/core/styles' }
            ]
          },
          {
            text: 'UX',
            collapsed: true,
            items: [
              { text: 'Buttons', link: '/architecture/ux/buttons' },
              { text: 'Controls', link: '/architecture/ux/controls' },
              { text: 'Details', link: '/architecture/ux/details' },
              { text: 'Paging', link: '/architecture/ux/paging' },
              { text: 'Preferences', link: '/architecture/ux/preferences' },
              { text: 'Search', link: '/architecture/ux/search' },
              { text: 'UX Manager', link: '/architecture/ux/ux' }
            ]
          }
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
        text: 'Work',
        collapsed: true,
        items: [
          {
            text: 'Done',
            collapsed: true,
            items: [
              { text: 'Breadcrumbs', link: '/work/done/breadcrumbs re-compositioon' },
              { text: 'Focus', link: '/work/done/focus' },
              { text: 'Tasks', link: '/work/done/tasks' },
              { text: 'Timers', link: '/work/done/timers' },
              { text: 'Widget Title', link: '/work/done/widget_title' }
            ]
          }
        ]
      }
    ],

    search: {
      provider: 'local'
    }
  }
})
