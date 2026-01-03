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

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/seriously-icon.png' }]
  ],

  themeConfig: {

    sidebar: [
      {
        text: 'Architecture',
        collapsed: true,
        items: [
          {
            text: 'Core',
            collapsed: true,
            items: [
            {
              text: 'Components',
              link: '/architecture/core/components'
            },
            {
              text: 'Databases',
              link: '/architecture/core/databases'
            },
            {
              text: 'Geometry',
              link: '/architecture/core/geometry'
            },
            {
              text: 'Hits',
              link: '/architecture/core/hits'
            },
            {
              text: 'Managers',
              link: '/architecture/core/managers'
            },
            {
              text: 'Persistable',
              link: '/architecture/core/persistable'
            },
            {
              text: 'Reactivity',
              link: '/architecture/core/reactivity'
            },
            {
              text: 'State',
              link: '/architecture/core/state'
            },
            {
              text: 'Styles',
              link: '/architecture/core/styles'
            },
            {
              text: 'Timers',
              link: '/architecture/core/timers'
            },
            {
              text: 'Titles',
              link: '/architecture/core/titles'
            },
            ]
          },
          {
            text: 'Other',
            collapsed: true,
            items: [
            {
              text: 'Bubble',
              link: '/architecture/other/bubble'
            },
            ]
          },
          {
            text: 'UX',
            collapsed: true,
            items: [
            {
              text: 'Breadcrumbs',
              link: '/architecture/ux/breadcrumbs'
            },
            {
              text: 'Buttons',
              link: '/architecture/ux/buttons'
            },
            {
              text: 'Controls',
              link: '/architecture/ux/controls'
            },
            {
              text: 'Details',
              link: '/architecture/ux/details'
            },
            {
              text: 'Paging',
              link: '/architecture/ux/paging'
            },
            {
              text: 'Preferences',
              link: '/architecture/ux/preferences'
            },
            {
              text: 'Search',
              link: '/architecture/ux/search'
            },
            {
              text: 'UX',
              link: '/architecture/ux/ux'
            },
            ]
          },
        ]
      },
      {
        text: 'Digest',
        link: '/digest'
      },
      {
        text: 'Guides',
        collapsed: true,
        items: [
          {
            text: 'Access',
            link: '/guides/access'
          },
          {
            text: 'Chat',
            link: '/guides/chat'
          },
          {
            text: 'Composition',
            link: '/guides/composition'
          },
          {
            text: 'Debugging',
            link: '/guides/debugging'
          },
          {
            text: 'Gotchas',
            link: '/guides/gotchas'
          },
          {
            text: 'Markdown',
            link: '/guides/markdown'
          },
          {
            text: 'Migration',
            link: '/guides/migration'
          },
          {
            text: 'Refactoring',
            link: '/guides/refactoring'
          },
          {
            text: 'Style',
            link: '/guides/style'
          },
          {
            text: 'Svelte 5',
            link: '/guides/svelte.5'
          },
          {
            text: 'VitePress',
            link: '/guides/vitepress'
          },
          {
            text: 'Voice',
            link: '/guides/voice'
          },
        ]
      },
      {
        text: 'Work',
        collapsed: true,
        items: [
          {
            text: 'Book',
            link: '/work/book'
          },
          {
            text: 'Done',
            collapsed: true,
            items: [
            {
              text: 'Focus',
              link: '/work/done/focus'
            },
            {
              text: 'Refactoring',
              collapsed: true,
              items: [
              {
                text: 'Banners',
                link: '/work/done/refactoring/banners'
              },
              {
                text: 'Breadcrumbs Re Compositioon',
                link: '/work/done/refactoring/breadcrumbs re-compositioon'
              },
              {
                text: 'Breadcrumbs',
                link: '/work/done/refactoring/breadcrumbs'
              },
              {
                text: 'Layout',
                link: '/work/done/refactoring/layout'
              },
              ]
            },
            {
              text: 'VitePress',
              collapsed: true,
              items: [
              {
                text: 'Redox',
                link: '/work/done/vitepress/redox'
              },
              {
                text: 'Webseriously Driven Docs',
                link: '/work/done/vitepress/webseriously-driven-docs'
              },
              ]
            },
            ]
          },
        ]
      }
    ],

    search: {
      provider: 'local'
    }
  }
})
