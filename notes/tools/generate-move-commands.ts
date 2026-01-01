#!/usr/bin/env node
/**
 * generate-move-commands: Analyze vitepress.build.txt and generate move-doc commands
 * 
 * Usage:
 *   node generate-move-commands.ts                    # Show proposed commands
 *   node generate-move-commands.ts --write batch.sh   # Write to script file
 */

import * as fs from 'fs';
import * as path from 'path';

const BUILD_FILE = 'vitepress.build.txt';
const DOCS_ROOT = path.join(process.cwd(), 'notes', 'designs');

interface DeadLink {
  link: string;        // The broken link path
  file: string;        // The file containing the broken link
  suggestedTarget?: string;  // Suggested new location
}

// Parse vitepress.build.txt for dead links
function parseDeadLinks(buildOutput: string): DeadLink[] {
  const deadLinks: DeadLink[] = [];
  
  // Match pattern: (!) Found dead link /path/to/file in file example.md
  const regex = /\(!\) Found dead link (.+?) in file (.+?)$/gm;
  
  let match;
  while ((match = regex.exec(buildOutput)) !== null) {
    deadLinks.push({
      link: match[1].trim(),
      file: match[2].trim()
    });
  }
  
  return deadLinks;
}

// Find files in docs that might match the broken link
function findPossibleTargets(brokenLink: string): string[] {
  const filename = path.basename(brokenLink, '.md');
  const possibleTargets: string[] = [];
  
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        if (entry.name === `${filename}.md`) {
          possibleTargets.push(path.relative(DOCS_ROOT, fullPath));
        }
      }
    }
  }
  
  if (fs.existsSync(DOCS_ROOT)) {
    walk(DOCS_ROOT);
  }
  
  return possibleTargets;
}

// Generate move-doc command
function generateMoveCommand(deadLink: DeadLink): string {
  const targets = findPossibleTargets(deadLink.link);
  
  if (targets.length === 0) {
    return `# UNFIXABLE: No target found for ${deadLink.link} (in ${deadLink.file})`;
  }
  
  if (targets.length === 1) {
    // Clean paths for command
    const oldPath = deadLink.link.replace(/^\//, '');
    const newPath = targets[0];
    return `move-doc "${oldPath}" "${newPath}"  # Fix link in ${deadLink.file}`;
  }
  
  // Multiple possibilities - let user choose
  return `# MULTIPLE OPTIONS for ${deadLink.link} (in ${deadLink.file}):\n` +
         targets.map(t => `#   move-doc "${deadLink.link.replace(/^\//, '')}" "${t}"`).join('\n');
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const writeToFile = args[0] === '--write' ? args[1] : null;
  
  // Read build output
  if (!fs.existsSync(BUILD_FILE)) {
    console.error(`Error: ${BUILD_FILE} not found. Run 'yarn docs:build' first.`);
    process.exit(1);
  }
  
  const buildOutput = fs.readFileSync(BUILD_FILE, 'utf-8');
  
  // Parse dead links
  const deadLinks = parseDeadLinks(buildOutput);
  
  if (deadLinks.length === 0) {
    console.log('✓ No dead links found! Build is clean.');
    process.exit(0);
  }
  
  console.log(`Found ${deadLinks.length} dead link(s)\n`);
  
  // Generate commands
  const commands: string[] = [
    '#!/bin/bash',
    '# Generated move-doc commands from vitepress.build.txt',
    `# Generated: ${new Date().toISOString()}`,
    '',
  ];
  
  for (const deadLink of deadLinks) {
    const command = generateMoveCommand(deadLink);
    commands.push(command);
    commands.push('');
    
    // Also print to console
    console.log(command);
    console.log('');
  }
  
  // Write to file if requested
  if (writeToFile) {
    fs.writeFileSync(writeToFile, commands.join('\n'), 'utf-8');
    fs.chmodSync(writeToFile, '755'); // Make executable
    console.log(`\n✓ Commands written to ${writeToFile}`);
    console.log(`  Review and execute with: ./${writeToFile}`);
  } else {
    console.log('\nTo write these commands to a file:');
    console.log('  node generate-move-commands.ts --write batch.sh');
  }
}

main().catch(console.error);
