import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(
  defineConfig({
    title: "Webseriously Inside Peak",
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
        text: 'Project',
        link: '/project'
        }, // @keep
        {
        text: 'Overview',
        link: '/overview'
        }, // @keep
        {
          text: 'Digest',
          link: '/digest'
        },
        {
          text: 'Architecture >',
          link: '/architecture/',
          collapsed: true,
          items: [
            {
              text: 'Core >',
              link: '/architecture/core/',
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
                  text: 'State',
                  link: '/architecture/core/state'
                },
                {
                  text: 'UX',
                  link: '/architecture/core/ux'
                }
              ]
            },
            {
              text: 'Internals >',
              link: '/architecture/internals/',
              collapsed: true,
              items: [
                {
                  text: 'Persistable',
                  link: '/architecture/internals/persistable'
                },
                {
                  text: 'Reactivity',
                  link: '/architecture/internals/reactivity'
                },
                {
                  text: 'Styles',
                  link: '/architecture/internals/styles'
                },
                {
                  text: 'Timers',
                  link: '/architecture/internals/timers'
                }
              ]
            },
            {
              text: 'Platforms >',
              link: '/architecture/platforms/',
              collapsed: true,
              items: [
                {
                  text: 'Bubble',
                  link: '/architecture/platforms/bubble'
                },
                {
                  text: 'Svelte 5',
                  link: '/architecture/platforms/svelte.5'
                },
                {
                  text: 'Svelte',
                  link: '/architecture/platforms/svelte'
                },
                {
                  text: 'VitePress',
                  link: '/architecture/platforms/vitepress'
                }
              ]
            },
            {
              text: 'UX >',
              link: '/architecture/ux/',
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
                  text: 'Titles',
                  link: '/architecture/ux/titles'
                }
              ]
            }
          ]
        },
        {
          text: 'Guides >',
          link: '/guides/',
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
              text: 'Voice',
              link: '/guides/voice'
            }
          ]
        },
        {
          text: 'Work >',
          link: '/work/',
          collapsed: true,
          items: [
            {
              text: 'Bad.tree.center',
              link: '/work/bad.tree.center'
            },
            {
              text: 'Book',
              link: '/work/book'
            },
            {
              text: 'Claude.write',
              link: '/work/claude.write'
            },
            {
              text: 'Layout',
              link: '/work/layout'
            },
            {
              text: 'Search Links',
              link: '/work/search-links'
            },
            {
              text: 'Done >',
              link: '/work/done/',
              collapsed: true,
              items: [
                {
                  text: 'Ethernet',
                  link: '/work/done/ethernet'
                },
                {
                  text: 'Filesystem',
                  link: '/work/done/filesystem'
                },
                {
                  text: 'Focus',
                  link: '/work/done/focus'
                },
                {
                  text: 'Migration >',
                  link: '/work/done/migration/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Focus',
                      link: '/work/done/migration/focus'
                    },
                    {
                      text: 'Grow Shrink',
                      link: '/work/done/migration/grow-shrink'
                    }
                  ]
                },
                {
                  text: 'Refactoring >',
                  link: '/work/done/refactoring/',
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
                    }
                  ]
                },
                {
                  text: 'VitePress >',
                  link: '/work/done/vitepress/',
                  collapsed: true,
                  items: [
                    {
                      text: 'Redox',
                      link: '/work/done/vitepress/redox'
                    },
                    {
                      text: 'Webseriously Driven Docs',
                      link: '/work/done/vitepress/webseriously-driven-docs'
                    }
                  ]
                }
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
)
