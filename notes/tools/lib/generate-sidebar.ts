import * as fs from 'fs';
import * as path from 'path';

interface SidebarItem {
  text: string;
  link?: string;
  items?: SidebarItem[];
  collapsed?: boolean;
}

export class SidebarGenerator {
  private srcDir: string;
  private srcExclude: string[];
  
  constructor(srcDir: string, srcExclude: string[] = []) {
    this.srcDir = srcDir;
    this.srcExclude = srcExclude;
  }

  /**
   * Generate sidebar structure from filesystem
   */
  generateSidebar(): SidebarItem[] {
    const sidebar: SidebarItem[] = [];
    
    // Get all top-level items
    const entries = fs.readdirSync(this.srcDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (this.shouldSkip(entry.name)) continue;
      
      const fullPath = path.join(this.srcDir, entry.name);
      
      if (entry.isDirectory()) {
        const dirItem = this.processDirectory(entry.name, fullPath);
        if (dirItem) {
          sidebar.push(dirItem);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const fileItem = this.processFile(entry.name, fullPath);
        if (fileItem) {
          sidebar.push(fileItem);
        }
      }
    }
    
    return sidebar;
  }

  private processDirectory(dirName: string, dirPath: string): SidebarItem | null {
    const items: SidebarItem[] = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (this.shouldSkip(entry.name)) continue;
      
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subDir = this.processDirectory(entry.name, fullPath);
        if (subDir) {
          items.push(subDir);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const fileItem = this.processFile(entry.name, fullPath);
        if (fileItem) {
          items.push(fileItem);
        }
      }
    }
    
    if (items.length === 0) {
      return null;
    }
    
    return {
      text: this.formatTitle(dirName),
      collapsed: true,
      items
    };
  }

  private processFile(fileName: string, filePath: string): SidebarItem | null {
    // Skip index files
    if (fileName === 'index.md') {
      return null;
    }
    
    // Generate link path relative to srcDir
    const relativePath = path.relative(this.srcDir, filePath);
    const linkPath = '/' + relativePath.replace(/\.md$/, '');
    
    return {
      text: this.formatTitle(fileName.replace(/\.md$/, '')),
      link: linkPath
    };
  }

  private shouldSkip(name: string): boolean {
    // Skip system files
    if (name.startsWith('.')) {
      return true;
    }
    
    // Skip excluded patterns
    for (const pattern of this.srcExclude) {
      if (pattern.endsWith('/**')) {
        const dirName = pattern.replace('/**', '');
        if (name === dirName) {
          return true;
        }
      } else if (name === pattern) {
        return true;
      }
    }
    
    return false;
  }

  private formatTitle(name: string): string {
    // Convert filename to title
    // Examples:
    // "getting-started" -> "Getting Started"
    // "vitepress" -> "VitePress"
    // "ux" -> "UX"
    
    // Special cases
    const specialCases: Record<string, string> = {
      'vitepress': 'VitePress',
      'ux': 'UX',
      'ui': 'UI',
      'api': 'API',
      'readme': 'README',
      'gotchas': 'Gotchas',
      'svelte.5': 'Svelte 5',
    };
    
    const lower = name.toLowerCase();
    if (specialCases[lower]) {
      return specialCases[lower];
    }
    
    // Convert kebab-case and snake_case to Title Case
    return name
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
