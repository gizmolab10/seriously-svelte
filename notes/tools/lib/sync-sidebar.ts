#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SidebarGenerator } from './generate-sidebar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SyncSidebar {
  private verbose: boolean = false;
  private repoRoot: string;
  private configPath: string;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
    this.repoRoot = this.findRepoRoot();
    this.configPath = path.join(this.repoRoot, '.vitepress', 'config.mts');
  }

  private findRepoRoot(): string {
    let currentDir = path.dirname(__dirname);
    
    while (currentDir !== '/') {
      if (fs.existsSync(path.join(currentDir, '.git'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    
    return process.cwd();
  }

  async sync(): Promise<void> {
    console.log(`Syncing sidebar with filesystem...`);

    // Read current config
    if (!fs.existsSync(this.configPath)) {
      console.error(`Error: Cannot find config at ${this.configPath}`);
      process.exit(1);
    }

    const configContent = fs.readFileSync(this.configPath, 'utf-8');
    
    // Extract srcDir and srcExclude from config
    const srcDirMatch = configContent.match(/srcDir:\s*['"](.+?)['"]/);
    const srcExcludeMatch = configContent.match(/srcExclude:\s*\[([^\]]+)\]/);
    
    const srcDir = srcDirMatch ? path.join(this.repoRoot, srcDirMatch[1]) : path.join(this.repoRoot, 'notes', 'designs');
    const srcExclude = srcExcludeMatch 
      ? srcExcludeMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''))
      : [];

    if (this.verbose) {
      console.log(`  Source directory: ${srcDir}`);
      console.log(`  Excluded: ${srcExclude.join(', ')}`);
    }

    // Generate new sidebar
    const generator = new SidebarGenerator(srcDir, srcExclude);
    const newSidebar = generator.generateSidebar();

    // Extract old sidebar for comparison
    const sidebarMatch = configContent.match(/sidebar:\s*(\[[\s\S]*?\n\s{4}\])/);
    const oldSidebarStr = sidebarMatch ? sidebarMatch[1] : '[]';
    
    // Count changes
    const stats = this.compareStructures(oldSidebarStr, newSidebar);

    // Build new config content
    const newSidebarStr = this.formatSidebar(newSidebar);
    const newConfigContent = configContent.replace(
      /sidebar:\s*\[[\s\S]*?\n\s{4}\]/,
      `sidebar: ${newSidebarStr}`
    );

    // Create backup
    const backupPath = this.configPath + '.original';
    fs.copyFileSync(this.configPath, backupPath);

    // Write new config
    fs.writeFileSync(this.configPath, newConfigContent);

    console.log(`✅ Complete`);
    if (stats.added > 0 || stats.removed > 0 || stats.updated > 0) {
      console.log(`Added ${stats.added}, removed ${stats.removed}, updated ${stats.updated}`);
    }
    if (this.verbose) {
      console.log(`Backup: ${backupPath}`);
    }
  }

  private compareStructures(oldStr: string, newSidebar: any[]): { added: number, removed: number, updated: number } {
    // Simple counting based on structure
    // This is approximate - just count items
    const oldCount = (oldStr.match(/text:/g) || []).length;
    const newCount = JSON.stringify(newSidebar).match(/text/g)?.length || 0;
    
    const diff = newCount - oldCount;
    return {
      added: diff > 0 ? diff : 0,
      removed: diff < 0 ? Math.abs(diff) : 0,
      updated: 0
    };
  }

  private formatSidebar(sidebar: any[], indent: number = 6): string {
    const indentStr = ' '.repeat(indent);
    const lines: string[] = ['['];
    
    for (let i = 0; i < sidebar.length; i++) {
      const item = sidebar[i];
      lines.push(indentStr + '{');
      lines.push(indentStr + `  text: '${item.text}',`);
      
      if (item.link) {
        lines.push(indentStr + `  link: '${item.link}'`);
      }
      
      if (item.items) {
        if (item.collapsed !== undefined) {
          lines.push(indentStr + `  collapsed: ${item.collapsed},`);
        }
        lines.push(indentStr + `  items: [`);
        for (const subItem of item.items) {
          this.formatSidebarItem(subItem, indent + 4, lines);
        }
        lines.push(indentStr + `  ]`);
      }
      
      lines.push(indentStr + '}' + (i < sidebar.length - 1 ? ',' : ''));
    }
    
    lines.push('    ]');
    return lines.join('\n');
  }

  private formatSidebarItem(item: any, indent: number, lines: string[]): void {
    const indentStr = ' '.repeat(indent);
    lines.push(indentStr + '{');
    lines.push(indentStr + `  text: '${item.text}',`);
    
    if (item.link) {
      lines.push(indentStr + `  link: '${item.link}'`);
    }
    
    if (item.items) {
      if (item.collapsed !== undefined) {
        lines.push(indentStr + `  collapsed: ${item.collapsed},`);
      }
      lines.push(indentStr + `  items: [`);
      for (const subItem of item.items) {
        this.formatSidebarItem(subItem, indent + 2, lines);
      }
      lines.push(indentStr + `  ]`);
    }
    
    lines.push(indentStr + '},');
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Sync Sidebar Tool

Usage:
  node sync-sidebar.ts         Sync sidebar with filesystem
  node sync-sidebar.ts -v      Verbose mode
  node sync-sidebar.ts --help  Show this help

Description:
  Scans the /notes/designs directory and updates the VitePress sidebar
  to match the actual filesystem structure.

  The tool:
  - Preserves existing group names and collapsed states
  - Skips index.md files and system files
  - Respects srcExclude directories from config
  - Creates backup (.vitepress/config.mts.original)

Exit codes:
  0 - Success
  1 - Error
  `);
  process.exit(0);
}

const verbose = args.includes('-v') || args.includes('--verbose');

const tool = new SyncSidebar(verbose);
tool.sync().catch(error => {
  console.error(`Fatal error: ${error}`);
  process.exit(1);
});
