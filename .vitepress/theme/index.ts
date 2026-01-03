import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window !== 'undefined') {
      // Setup after hydration
      const setup = () => setTimeout(() => setupSidebarToggle(router), 100)
      setup()
      router.onAfterRouteChanged = setup
    }
  }
}

function setupSidebarToggle(router: any) {
  const items = document.querySelectorAll('.VPSidebarItem.collapsible')
  
  items.forEach(item => {
    const link = item.querySelector(':scope > .item > a.link') as HTMLAnchorElement
    const itemDiv = item.querySelector(':scope > .item') as HTMLElement
    const caret = item.querySelector(':scope > .item .caret') as HTMLElement
    
    if (link && itemDiv && !itemDiv.hasAttribute('data-toggle-setup')) {
      itemDiv.setAttribute('data-toggle-setup', 'true')
      
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href')
        const currentPath = window.location.pathname
        
        // Check if we're already on this page
        const isCurrentPage = href && (
          currentPath === href ||
          currentPath === href + '.html' ||
          currentPath.endsWith(href.replace(/\/$/, '/index.html'))
        )
        
        // Check if section is expanded
        const isExpanded = item.classList.contains('is-active') || 
                          !item.classList.contains('collapsed')
        
        if (isCurrentPage && isExpanded) {
          // Already on page and expanded - collapse instead of navigating
          e.preventDefault()
          e.stopPropagation()
          caret?.click() // Trigger collapse via caret
        }
        // Otherwise, let default navigation happen (which also expands)
      })
    }
  })
}
