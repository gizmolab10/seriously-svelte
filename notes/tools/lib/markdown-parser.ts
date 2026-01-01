import * as fs from 'fs';
import * as path from 'path';

export interface Link {
  text: string;
  target: string;
  line: number;
  isWikilink: boolean;
  anchor?: string;
}

export class MarkdownParser {
  /**
   * Parse a markdown file and extract all links
   * @param filePath Path to the markdown file
   * @returns Array of links found in the file
   */
  static parseFile(filePath: string): Link[] {
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parseContent(content);
  }

  /**
   * Parse markdown content and extract all links
   * @param content Markdown content as string
   * @returns Array of links found in the content
   */
  static parseContent(content: string): Link[] {
    const links: Link[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Track code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // Skip lines inside code blocks
      if (inCodeBlock) {
        continue;
      }

      // Find wikilinks [[file]] or [[file.md]]
      const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
      let match;
      while ((match = wikilinkRegex.exec(line)) !== null) {
        const target = match[1];
        const [file, anchor] = target.split('#');
        links.push({
          text: target,
          target: file.endsWith('.md') ? file : `${file}.md`,
          line: i + 1,
          isWikilink: true,
          anchor: anchor || undefined,
        });
      }

      // Find markdown links [text](path/file.md)
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      while ((match = markdownLinkRegex.exec(line)) !== null) {
        const text = match[1];
        const target = match[2];

        // Skip image links and external links
        if (target.startsWith('http://') || target.startsWith('https://') || target.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          continue;
        }

        const [file, anchor] = target.split('#');
        links.push({
          text,
          target: file,
          line: i + 1,
          isWikilink: false,
          anchor: anchor || undefined,
        });
      }
    }

    return links;
  }

  /**
   * Update links in a markdown file
   * @param filePath Path to the markdown file
   * @param replacements Map of old target -> new target
   * @returns Number of links updated
   */
  static updateLinks(filePath: string, replacements: Map<string, string | null>): number {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let inCodeBlock = false;
    let updatedCount = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Track code blocks
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      // Skip lines inside code blocks
      if (inCodeBlock) {
        continue;
      }

      let shouldDeleteLine = false;

      // Update wikilinks
      const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
      line = line.replace(wikilinkRegex, (match, target) => {
        const [file, anchor] = target.split('#');
        const normalizedFile = file.endsWith('.md') ? file : `${file}.md`;
        
        for (const [oldPath, newPath] of replacements.entries()) {
          if (this.pathsMatch(normalizedFile, oldPath)) {
            updatedCount++;
            if (newPath === null) {
              // Mark line for deletion
              shouldDeleteLine = true;
              return '';
            }
            // Update the link, preserving anchor
            const newTarget = anchor ? `${newPath}#${anchor}` : newPath;
            return `[[${newTarget.replace('.md', '')}]]`;
          }
        }
        return match;
      });

      // Update markdown links
      const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      line = line.replace(markdownLinkRegex, (match, text, target) => {
        // Skip image links and external links
        if (target.startsWith('http://') || target.startsWith('https://') || target.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          return match;
        }

        const [file, anchor] = target.split('#');
        
        for (const [oldPath, newPath] of replacements.entries()) {
          if (this.pathsMatch(file, oldPath)) {
            updatedCount++;
            if (newPath === null) {
              // Mark line for deletion
              shouldDeleteLine = true;
              return '';
            }
            // Update the link, preserving anchor
            const newTarget = anchor ? `${newPath}#${anchor}` : newPath;
            return `[${text}](${newTarget})`;
          }
        }
        return match;
      });

      // If line had a deleted link, check if we should remove the entire line
      if (shouldDeleteLine) {
        // Remove the line entirely if it's become meaningless after deletion
        const trimmed = line.trim();
        // Match patterns like:
        // - Empty: ''
        // - Just bullet: '-' or '*'
        // - Bullet with whitespace: '- ' or '* '
        // - Bullet with dash and short trailing text: '-  - This file was deleted'
        if (!trimmed || 
            trimmed === '-' || 
            trimmed === '*' ||
            trimmed.match(/^[-*]\s*$/) || 
            trimmed.match(/^[-*]\s+-\s+/)) {
          lines[i] = '';
          continue;
        }
      }

      lines[i] = line;
    }

    if (updatedCount > 0) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    }

    return updatedCount;
  }

  /**
   * Check if two file paths refer to the same file (ignoring directory paths)
   */
  private static pathsMatch(path1: string, path2: string): boolean {
    const normalize = (p: string) => {
      // Remove leading ./ or /
      p = p.replace(/^\.?\//, '');
      // Get just the filename
      return path.basename(p);
    };
    return normalize(path1) === normalize(path2);
  }
}
