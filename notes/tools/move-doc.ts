#!/usr/bin/env node
/**
 * move-doc: Move markdown files and update all references
 * 
 * Usage:
 *   move-doc --do old/path.md new/path.md    # Move file and fix links
 *   move-doc old/path.md new/path.md          # File already moved, just fix links
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const DOCS_ROOT = path.join(process.cwd(), 'notes', 'designs');
const CONFIG_PATH = path.join(process.cwd(), '.vitepress', 'config.mts');

interface MoveOptions {
  doMove: boolean;
  oldPath: string;
  newPath: string;
}

// Parse command line arguments
function parseArgs(): MoveOptions | null {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: move-doc [--do] <old-path> <new-path>');
    return null;
  }
  
  const doMove = args[0] === '--do';
  const [oldPath, newPath] = doMove ? [args[1], args[2]] : [args[0], args[1]];
  
  if (!oldPath || !newPath) {
    console.error('Both old and new paths are required');
    return null;
  }
  
  return { doMove, oldPath, newPath };
}

// Convert relative path to absolute based on DOCS_ROOT
function toAbsolutePath(relativePath: string): string {
  return path.join(DOCS_ROOT, relativePath);
}

// Find all markdown files in docs
function findMarkdownFiles(): string[] {
  const files: string[] = [];
  
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(DOCS_ROOT);
  return files;
}

// Find links in markdown content
function findLinks(content: string): Array<{ match: string; path: string; line: number }> {
  const links: Array<{ match: string; path: string; line: number }> = [];
  const lines = content.split('\n');
  
  // Match markdown links: [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  lines.forEach((line, lineNum) => {
    // Skip code blocks (simple check for lines starting with backticks)
    if (line.trim().startsWith('```')) {
      return;
    }
    
    let match;
    while ((match = linkRegex.exec(line)) !== null) {
      const linkPath = match[2];
      
      // Only process internal links (not URLs)
      if (!linkPath.startsWith('http://') && !linkPath.startsWith('https://')) {
        links.push({
          match: match[0],
          path: linkPath,
          line: lineNum + 1
        });
      }
    }
  });
  
  return links;
}

// Resolve a link path relative to a markdown file
function resolveLinkPath(markdownFilePath: string, linkPath: string): string {
  const dir = path.dirname(markdownFilePath);
  const resolved = path.resolve(dir, linkPath);
  return resolved;
}

// Check if a link points to a specific file
function linkPointsToFile(markdownFilePath: string, linkPath: string, targetPath: string): boolean {
  const resolved = resolveLinkPath(markdownFilePath, linkPath);
  const normalizedTarget = path.normalize(targetPath);
  
  // Handle links with and without .md extension
  const resolvedWithoutExt = resolved.replace(/\.md$/, '');
  const targetWithoutExt = normalizedTarget.replace(/\.md$/, '');
  
  return resolvedWithoutExt === targetWithoutExt;
}

// Calculate new link path
function calculateNewLinkPath(markdownFilePath: string, oldTargetPath: string, newTargetPath: string): string {
  const dir = path.dirname(markdownFilePath);
  const relPath = path.relative(dir, newTargetPath);
  
  // Ensure forward slashes for URLs
  return relPath.split(path.sep).join('/');
}

// Update links in a file
function updateLinksInFile(filePath: string, oldPath: string, newPath: string): { updated: boolean; count: number } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const links = findLinks(content);
  
  let updated = false;
  let count = 0;
  let newContent = content;
  
  for (const link of links) {
    if (linkPointsToFile(filePath, link.path, oldPath)) {
      const newLinkPath = calculateNewLinkPath(filePath, oldPath, newPath);
      const newMatch = link.match.replace(link.path, newLinkPath);
      
      newContent = newContent.replace(link.match, newMatch);
      updated = true;
      count++;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
  }
  
  return { updated, count };
}

// Update VitePress config
function updateConfig(oldPath: string, newPath: string): boolean {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn('VitePress config not found');
    return false;
  }
  
  const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
  
  // Convert paths to VitePress link format (remove .md, ensure leading /)
  const oldLink = '/' + oldPath.replace(/\.md$/, '').replace(/\\/g, '/');
  const newLink = '/' + newPath.replace(/\.md$/, '').replace(/\\/g, '/');
  
  // Simple replacement - look for link: 'oldPath' patterns
  const updated = content.replace(
    new RegExp(`link:\\s*['"]${oldLink.replace(/\//g, '\\/')}['"]`, 'g'),
    `link: '${newLink}'`
  );
  
  if (updated !== content) {
    fs.writeFileSync(CONFIG_PATH, updated, 'utf-8');
    return true;
  }
  
  return false;
}

// Main function
async function main() {
  const options = parseArgs();
  if (!options) {
    process.exit(1);
  }
  
  const oldAbsPath = toAbsolutePath(options.oldPath);
  const newAbsPath = toAbsolutePath(options.newPath);
  
  console.log(`\nProcessing: ${options.oldPath} -> ${options.newPath}`);
  
  // If --do flag, move the file
  if (options.doMove) {
    if (!fs.existsSync(oldAbsPath)) {
      console.error(`Error: Source file does not exist: ${oldAbsPath}`);
      process.exit(1);
    }
    
    if (fs.existsSync(newAbsPath)) {
      console.error(`Error: Target file already exists: ${newAbsPath}`);
      process.exit(1);
    }
    
    // Create target directory if needed
    const newDir = path.dirname(newAbsPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
      console.log(`Created directory: ${newDir}`);
    }
    
    // Move the file
    fs.renameSync(oldAbsPath, newAbsPath);
    console.log(`✓ Moved file`);
  } else {
    // Verify new file exists
    if (!fs.existsSync(newAbsPath)) {
      console.error(`Error: New file does not exist: ${newAbsPath}`);
      process.exit(1);
    }
  }
  
  // Find and update all markdown files
  console.log('Scanning markdown files for links...');
  const markdownFiles = findMarkdownFiles();
  
  let filesUpdated = 0;
  let totalLinksUpdated = 0;
  
  for (const file of markdownFiles) {
    const result = updateLinksInFile(file, oldAbsPath, newAbsPath);
    if (result.updated) {
      filesUpdated++;
      totalLinksUpdated += result.count;
      const relPath = path.relative(DOCS_ROOT, file);
      console.log(`✓ Updated ${result.count} link(s) in ${relPath}`);
    }
  }
  
  // Update VitePress config
  const configUpdated = updateConfig(options.oldPath, options.newPath);
  if (configUpdated) {
    console.log('✓ Updated VitePress config');
  }
  
  // Summary
  console.log(`\nSummary:`);
  console.log(`- Files updated: ${filesUpdated}`);
  console.log(`- Links updated: ${totalLinksUpdated}`);
  console.log(`- Config updated: ${configUpdated ? 'Yes' : 'No'}`);
}

main().catch(console.error);
