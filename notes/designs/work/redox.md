# Document links

## Situation normal

**Obsidian:** Auto-updates wikilinks (`[[file]]`) when renaming/moving files within Obsidian
**VitePress:** (via `update docs`) Detects and reports broken links
## Problem

VitePress detects broken links but nothing fixes them. We need two tools:
- **Tool 1:** Fix broken links (automated via `update docs`)
- **Tool 2:** Merge files (manual CLI command)

## When I say "Fix broken links"

Invocation: Runs automatically during `update docs` builds

- [ ] read broken links from `vitepress.build.txt` (format: "Dead link: path/to/file.md -> missing-file.md")
- [ ] within notes and in VitePress config.mts:
	- [ ] find each moved file by searching repo for filename matching its dead link (ignore path)
	- [ ] update broken links to point to new locations (including path if relevant)
	- [ ] update VitePress config sidebar entries
	- [ ] if target file doesn't exist anywhere, delete the broken link
- [ ] report summary: fixed, deleted, unfixable

## When I say "Merge A into B"

Invocation: Manual CLI command with two file paths

- [ ] create backups: A.original and B.original
- [ ] analyze A and B, identify duplicate content in A
- [ ] copy unique content from A into B:
	- [ ] for each unique section in A:
		- [ ] find best-fit heading in B (or create new one)
		- [ ] insert at start of that section
- [ ] update TOC in B
- [ ] preserve A, A.original and B.original (for manual review/undo)
- [ ] update all links pointing to A → redirect to B
- [ ] update VitePress config.mts: remove A, keep B

## Constraints & Assumptions

**File conventions:**
- Process `.md` files only
- Search within `/notes` directory and subdirectories
- Use relative paths from repo root
- Assume UTF-8 encoding
- No max file size limit (reasonable docs assumed)

**Link conventions:**
- Wikilinks: `[[file]]` or `[[file.md]]`
- Markdown links: `[text](path/file.md)`
- Image links are ignored (not modified)
- Links in code blocks are ignored (triple backticks)

## Error Handling

**Tool 1:** (While parsing `vitepress.build.txt` for dead links)
- Missing build file → Done, log warning
- Malformed → Skip invalid lines, continue
- No target found for link → Delete it (as specified)
- Multiple files match same filename → Prompt user to choose, or skip (counts as "unfixable")
- VitePress config parse error → Log error, continue with markdown files (affected links count as "unfixable")

**Tool 2:** (Merge A into B)
- A or B doesn't exist → Exit with error, show usage
- A and B are same file → Exit with error
- Duplicate headings in B → Insert under first matching heading
- TOC parse fails → Log warning, skip TOC update
- Link update fails → Log warning, continue

**General:**
- Circular links → Ignore, not our problem (VitePress will flag)
- File write permission errors → Exit with error message
- Git conflicts → User handles manually

## Edge Cases

**Tool 1:**
- File links to itself → Ignore, valid self-reference
- Broken link appears in code block → Skip (don't modify)
- Link uses anchor `#heading` → Preserve anchor after fix
  - Example: `[text](old/path.md#section)` becomes `[text](new/path.md#section)`
  - The `#section` anchor must be preserved when updating the path
- Multiple broken links to same missing file → Delete all

**Tool 2:**
- A is empty → Skip merge, just update links and config
- B is empty → Move A content wholesale, simpler merge
- Both files identical → Delete A, update links/config only
- Heading exists in both → Merge under existing heading

## Implementation Details

**Language & tooling:**
- Node.js with TypeScript
- Use existing project dependencies where possible
- New dependencies: `remark` (markdown parsing), `glob` (file search)

**Project structure:**
```
notes/tools/
  fix-links.ts        # Tool 1
  merge-files.ts      # Tool 2
  lib/
    markdown-parser.ts
    link-finder.ts
    config-updater.ts
```

**Command line usage:**

Tool 1 (Fix broken links):
```bash
node notes/tools/fix-links.ts           # Run with default settings
node notes/tools/fix-links.ts -v        # Verbose mode (show each change)
node notes/tools/fix-links.ts --help    # Show usage
```

Tool 2 (Merge files):
```bash
node notes/tools/merge-files.ts A.md B.md       # Merge A into B
node notes/tools/merge-files.ts -v A.md B.md    # Verbose mode
node notes/tools/merge-files.ts --help          # Show usage
```

**VitePress config.mts structure:**
```typescript
export default {
  themeConfig: {
    sidebar: [
      {
        text: 'Guides',
        items: [
          { text: 'Getting Started', link: '/notes/guides/getting-started' },
          { text: 'Debugging', link: '/notes/guides/debugging' },
          // Tool updates these link values when files move
        ]
      }
    ]
  }
}
```
Tools identify entries by matching the `link` property against moved/deleted file paths.

**Integration with `update docs`:**
- Modify CLAUDE.MD `update docs` command to add after `yarn docs:build`:
  ```bash
  node notes/tools/fix-links.ts
  if [ $? -ne 0 ]; then
    echo "Link fixing failed, check logs"
    exit 1
  fi
  ```
- Check exit code, proceed only if successful

## Testing Strategy
All testing is done in a test fixture, with a **current copy** of `.vitepress/config.mts`

**Test fixtures location:**
- `/notes/work/test-fixtures/`
- Contains sample markdown files with various link patterns
- Contains sample broken `vitepress.build.txt`

**Test approach:**
- Copy the **current version** of `.vitepress/config.mts`
- Create fixtures, run tools, verify changes
- Use git to show diffs before/after
- Test each error condition with malformed inputs
- Run on fixtures before deploying to real docs

**Rollback procedure:** (NB, this only works if git status is up to date)
- All tools preserve `.original` backup files
- Use `git restore` for immediate rollback
- Review `.original` files before deleting them

**Backup cleanup strategy:**
- `.original` files are never auto-deleted
- Manual cleanup: User reviews and deletes when satisfied with changes
- Recommended workflow:
  1. Run tool, inspect results
  2. Test that links work
  3. If satisfied: `rm *.original`
  4. If not: `git restore` affected files, review `.original` files

## Output & Logging

**Console output:**
- Summary: "Fixed 12 links, deleted 3, skipped 1"
- Detailed mode: Show each link changed (optional `-v` flag)
- Errors: Red text, clear error messages
- Warnings: Yellow text

**File logging:**
- Write detailed log to `notes/work/test-fixtures/fix-links.log`
- Append mode (don't overwrite)
- Include timestamp, file paths, actions taken

**Exit codes:**
- 0: Success
- 1: Error (file not found, parse error, etc.)
- 2: Warning (some operations skipped, but completed)

## Implementation

**Phase 1: Build Tool 1 (Fix broken links)**
- [ ] Set up project structure in `notes/tools/`
- [ ] Install dependencies: `remark`, `glob`
- [ ] Implement `lib/markdown-parser.ts`
  - [ ] Parse markdown files
  - [ ] Extract links (both wikilinks and markdown links)
  - [ ] Preserve code blocks (don't parse links inside them)
- [ ] Implement `lib/link-finder.ts`
  - [ ] Search repo for files by filename
  - [ ] Handle multiple matches (prompt user)
  - [ ] Return file paths
- [ ] Implement `lib/config-updater.ts`
  - [ ] Parse VitePress config.mts
  - [ ] Update sidebar link entries
  - [ ] Remove entries for deleted files
- [ ] Implement `fix-links.ts` main script
  - [ ] Parse `vitepress.build.txt`
  - [ ] Find moved files
  - [ ] Update broken links in markdown files
  - [ ] Update VitePress config
  - [ ] Delete links to non-existent files
  - [ ] Generate summary report
  - [ ] Handle `-v` and `--help` flags
- [ ] Create test fixtures
- [ ] Test on fixtures
- [ ] Update CLAUDE.MD `update docs` command

**Phase 2: Build Tool 2 (Merge files)**
- [ ] Implement `merge-files.ts` main script
  - [ ] Parse command line args (A.md B.md)
  - [ ] Create `.original` backups
  - [ ] Analyze both files for duplicate content
  - [ ] Identify unique sections in A
  - [ ] Find best-fit headings in B
  - [ ] Insert unique content into B
  - [ ] Update TOC in B
  - [ ] Find and update all links to A → B
  - [ ] Update VitePress config (remove A, keep B)
  - [ ] Handle `-v` and `--help` flags
- [ ] Create test fixtures for merge scenarios
- [ ] Test on fixtures

**Phase 3: Integration & Documentation**
- [ ] Verify `update docs` automation works
- [ ] Document tools in project README
- [ ] Run full test suite
- [ ] Deploy to production use
