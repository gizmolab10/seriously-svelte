# Problem-Solving Session

## Problem

Documentation reorganization creates dead links. Need reliable tooling to fix them automatically.

### I need to ask of Claude:

1. [I moved foo.md from guides to guides/advanced](#when-i-say-i-moved-foomd-from-guides-to-guidesadvanced)
2. [Move foo.md from guides to guides/advanced](#when-i-say-move-foomd-from-guides-to-guidesadvanced)
3. [Check for broken links](#when-i-say-check-for-broken-links)
4. [Fix all broken links](#when-i-say-fix-broken-links)
5. [I created foo.md at notes/designs/work](#when-i-say-i-created-foomd-at-notesdesignswork)

## Table of Contents

- [Problem](#problem)
- [I need to ask of Claude](#i-need-to-ask-of-claude)
- [Solution: Two Tools](#solution-two-tools)
  - [move-doc](#1-move-doc---proactive-mover)
  - [fix-links](#2-fix-links---link-scanner--fixer)
- [Implementation](#implementation)
- [Progress Tracker](#progress-tracker)

## Solution: Two Tools

### 1. `move-doc` - Proactive Mover

Moves files and updates all references automatically.

**Usage:**

```bash
move-doc --do old/path.md new/path.md
move-doc --merge file1.md file2.md destination.md
move-doc old/path.md new/path.md  # File already moved, just fix links
```

#### **What it does:**

- [ ] Moves the file (if `--do`)
- [ ] Finds and updates all links to it (markdown files + VitePress config)
- [ ] Handles relative and absolute paths
- [ ] Creates target directories if needed

#### **Safety:**

- [ ] Dry-run mode shows changes before applying
- [ ] Confirms before moving
- [ ] Errors if target already exists (if `--do`)
- [ ] Skips links in code blocks

#### **Use cases:**

*Planning a move:*

```bash
# You want to reorganize: move guides/debugging.md into guides/advanced/
move-doc --do guides/debugging.md guides/advanced/debugging.md
# Tool moves the file AND fixes all links pointing to it
```

##### When I say "I moved foo.md from guides to guides/advanced":

- [ ] repair all broken links pointing to the old path so that they point to the new path
- [ ] update VitePress config sidebar entries

*Already moved the file:*

```bash
# You already moved guides/debugging.md to guides/advanced/debugging.md manually
# Now you just need to fix all the broken links
move-doc guides/debugging.md guides/advanced/debugging.md
# Tool skips the move, just fixes all links
```

##### When I say "Move foo.md from guides to guides/advanced":

- [ ] move the file AND fix all links (as above)

#### **Batch processing:**

When Claude runs `move-doc` multiple times (e.g., after reorganizing several files):

- [ ] First run: Shows what will change, asks "Continue? (y/n/all)"
- [ ] If you answer "all": Processes remaining files without prompting
- [ ] If you answer "y": Processes this file, prompts again for next one
- [ ] If you answer "n": Skips this file, prompts for next one

Summary shown at the end:

- [ ] Files processed: 5
- [ ] Links updated: 23
- [ ] Config entries updated: 5
- [ ] Skipped: 1

#### **Testing:**

*Single file scenario:*

```bash
# Test moving one file
move-doc --do guides/test.md guides/advanced/test.md
# Verify:
# - File moved to new location
# - All links to test.md updated
# - VitePress config updated
# - Original file removed
```

*Batch scenario:*

```bash
# Create test files with cross-references
touch guides/file1.md guides/file2.md guides/file3.md
# Add links between them
# Move all to guides/advanced/
move-doc --do guides/file1.md guides/advanced/file1.md
move-doc --do guides/file2.md guides/advanced/file2.md
move-doc --do guides/file3.md guides/advanced/file3.md
# Verify:
# - All files moved
# - Cross-references still work
# - No broken links remain
```

#### **Implement:**

- [ ] Build `move-doc`
- [ ] Create test fixtures
- [ ] Run all test scenarios on practice files (ignore this for now)

### 2. `fix-links` - Link Scanner & Fixer

Finds broken links and fixes them (safety net for manual moves).

**Usage:**

```bash
fix-links              # Scan and report
fix-links --fix        # Fix with confirmation
fix-links --auto       # Fix without confirmation
fix-links --add <path> # Add new file to config and index
```

#### **What it does:**

- [ ] Scans all markdown files for internal links
- [ ] Checks if targets exist
- [ ] Finds moved files by name matching
- [ ] Updates broken links
- [ ] Reports unfixable links

#### **Safety:**

- [ ] Dry-run by default (needs explicit `--fix` flag)
- [ ] Shows what would change
- [ ] Lets you choose when multiple matches found
- [ ] Relies on git for backups

#### **Use cases:**

*After manual reorganization:*

```bash
# You manually moved several files around
# Now check for broken links
fix-links
# Shows: Found 12 broken links in 8 files
```

##### When I say "Check for broken links":

- [ ] scan all markdown files for links
- [ ] check if link targets exist
- [ ] report broken links with suggested fixes

*Auto-fixing broken links:*

```bash
# You want to fix all broken links automatically
fix-links --fix
# Shows each broken link, suggests fix, asks to apply
```

##### When I say "Fix broken links":

- [ ] find moved files by name matching
- [ ] update broken links to point to new locations
- [ ] update VitePress config
- [ ] report any unfixable links

*After creating a new file:*

```bash
# You created notes/designs/work/foo.md
# Need to add it to index and VitePress config
fix-links --add work/foo.md
# Adds file to appropriate index and sidebar
```

##### When I say "I created foo.md at notes/designs/work":

	- [ ] detect which section it belongs in (based on directory)
	- [ ] add entry to VitePress config sidebar
	- [ ] optionally add to index.md in that directory

#### **Batch processing:**

When fixing multiple broken links:

- [ ] First broken link: Shows suggested fix, asks "Apply? (y/n/all/skip-all)"
- [ ] If you answer "all": Applies all suggested fixes without prompting
- [ ] If you answer "skip-all": Reports remaining broken links without fixing
- [ ] If you answer "y": Applies this fix, prompts for next one
- [ ] If you answer "n": Skips this fix, prompts for next one

Summary shown at the end:

- [ ] Broken links found: 12
- [ ] Links fixed: 10
- [ ] Unfixable: 2 (file deleted)
- [ ] Skipped: 0

#### **Testing:**

*Single broken link scenario:*

```bash
# Manually move a file without updating links
mv guides/test.md guides/advanced/test.md
# Run fix-links
fix-links --fix
# Verify:
# - Broken link detected
# - Correct new location suggested
# - Link updated after confirmation
# - VitePress config updated
```

*Batch scenario:*

```bash
# Manually reorganize multiple files
mv guides/file1.md guides/advanced/
mv guides/file2.md architecture/
mv guides/file3.md guides/basics/
# Run fix-links
fix-links --fix
# Respond "all" to first prompt
# Verify:
# - All broken links found
# - All fixed automatically
# - Summary shows correct counts
# - No broken links remain in build
```

#### **Implement:**

- [ ] Build `fix-links`
- [ ] Create test fixtures
- [ ] Run all test scenarios on practice files (ignore this for now)

## Implementation

**Language:** Node/TypeScript (already in project)

**Key libraries:**

- [ ] `remark` - Parse markdown reliably
- [ ] `glob` - Find files
- [ ] `chalk` + `inquirer` - Nice CLI

**Structure:**

```
notes/tools/
  move-doc.ts
  fix-links.ts
  lib/
    link-finder.ts       # Parse markdown for links
    link-resolver.ts     # Resolve relative paths
    config-updater.ts    # Update VitePress config
    file-matcher.ts      # Find moved files
```

**Testing:**
Create test fixtures before running on real docs.

**Integration with "update docs":**

- [ ] Run `fix-links --check-only` first
- [ ] If broken links found, fix them
- [ ] Then run `yarn docs:build`

## Next Action

Build `move-doc` first (highest value).

## Progress Tracker

### Building move-doc

**Step 1: Set up project structure**

- [x] Created `/notes/tools/move-doc.ts`
- [x] Basic TypeScript structure with Node built-ins (no external dependencies needed yet)

**Step 2: Core functionality implemented**

- [x] Command line argument parsing (`--do` flag support)
- [x] File moving with directory creation
- [x] Markdown file scanning
- [x] Link detection in markdown files
- [x] Link path resolution (relative paths)
- [x] Link updating
- [x] VitePress config updating
- [x] Summary reporting

**Step 3: Test the implementation**

- [x] Created test fixtures in `/notes/designs/test-fixtures/`
  - test1.md (with links to test2.md)
  - test2.md (to be moved)
  - subfolder/ (target directory)

**Step 4: Ready for manual testing**

The tool is ready! You can test it with:

```bash
# From the repo root
node --loader ts-node/esm notes/tools/move-doc.ts --do test-fixtures/test2.md test-fixtures/subfolder/test2.md
```

Or add to package.json scripts:
```json
"move-doc": "node --loader ts-node/esm notes/tools/move-doc.ts"
```

Then use:
```bash
yarn move-doc --do test-fixtures/test2.md test-fixtures/subfolder/test2.md
```

**What the tool does:**
1. Parses command line args (--do flag for actual move)
2. Moves file if --do specified (creates directories as needed)
3. Scans all markdown files in notes/designs
4. Finds links pointing to the old file
5. Updates those links to point to new location
6. Updates VitePress config sidebar entries
7. Prints summary of changes

**Next:** Test on fixtures, then use on real docs when ready

