import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
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
          text: 'Overview',
          link: './overview'
        },
        {
          text: 'Digest',
          link: '/digest'
        },
        {
          text: 'Architecture',
          link: '/architecture/',
          collapsed: true,
          items: [
            {
              text: 'Core',
              link: '/architecture/core/',
              collapsed: true,
              items: [
                { text: 'Components', link: '/architecture/core/components' },
                { text: 'Databases', link: '/architecture/core/databases' },
                { text: 'Geometry', link: '/notes/designs/architecture/core/geometry' },
                { text: 'Hits', link: '/notes/designs/architecture/core/hits' },
                { text: 'Managers', link: '/notes/designs/architecture/core/managers' },
                { text: 'State', link: '/notes/designs/architecture/core/state' },
                { text: 'UX Manager', link: '/notes/designs/architecture/core/ux' },
              ]
            },
            {
              text: 'More',
              link: '/architecture/more/',
              collapsed: true,
              items: [
                { text: 'Persistable', link: '/architecture/more/persistable' },
                { text: 'Reactivity', link: '/architecture/more/reactivity' },
                { text: 'Styles', link: '/architecture/more/styles' },
                { text: 'Timers', link: '/architecture/more/timers' },
              ]
            },
            {
              text: 'UX',
              link: '/architecture/ux/',
              collapsed: true,
              items: [
                { text: 'Breadcrumbs', link: '/architecture/ux/breadcrumbs' },
                { text: 'Buttons', link: '/architecture/ux/buttons' },
                { text: 'Controls', link: '/architecture/ux/controls' },
                { text: 'Details', link: '/architecture/ux/details' },
                { text: 'Paging', link: '/architecture/ux/paging' },
                { text: 'Preferences', link: '/architecture/ux/preferences' },
                { text: 'Search', link: '/architecture/ux/search' },
                { text: 'Titles', link: '/architecture/ux/titles' },
              ]
            },
            {
              text: 'Other',
              link: '/architecture/other/',
              collapsed: true,
              items: [
                { text: 'Bubble', link: '/architecture/other/bubble' },
              ]
            },
          ]
        },
        {
          text: 'Guides',
          link: '/guides/',
          collapsed: true,
          items: [
            { text: 'Access', link: '/guides/access' },
            { text: 'Chat', link: '/guides/chat' },
            { text: 'Composition', link: '/guides/composition' },
            { text: 'Debugging', link: '/guides/debugging' },
            { text: 'Gotchas', link: '/guides/gotchas' },
            { text: 'Markdown', link: '/guides/markdown' },
            { text: 'Migration', link: '/guides/migration' },
            { text: 'Refactoring', link: '/guides/refactoring' },
            { text: 'Style', link: '/guides/style' },
            { text: 'Svelte 5', link: '/guides/svelte.5' },
            { text: 'VitePress', link: '/guides/vitepress' },
            { text: 'Voice', link: '/guides/voice' },
          ]
        },
        {
          text: 'Work',
          link: '/work/',
          collapsed: true,
          items: [
            { text: 'Book', link: '/work/book' },
            {
              text: 'Done',
              link: '/work/done/',
              collapsed: true,
              items: [
                { text: 'Focus', link: '/work/done/focus' },
                {
                  text: 'Refactoring',
                  link: '/work/done/refactoring/',
                  collapsed: true,
                  items: [
                    { text: 'Banners', link: '/work/done/refactoring/banners' },
                    { text: 'Breadcrumbs Re-composition', link: '/work/done/refactoring/breadcrumbs re-compositioon' },
                    { text: 'Breadcrumbs', link: '/work/done/refactoring/breadcrumbs' },
                    { text: 'Layout', link: '/work/done/refactoring/layout' },
                  ]
                },
                {
                  text: 'VitePress',
                  link: '/work/done/vitepress/',
                  collapsed: true,
                  items: [
                    { text: 'Redox', link: '/work/done/vitepress/redox' },
                    { text: 'Webseriously Driven Docs', link: '/work/done/vitepress/webseriously-driven-docs' },
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
)
