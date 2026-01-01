# Document links

## Situation normal

**Obsidian.** Auto-updates wikilinks (`[[file]]`) when renaming/moving files within Obsidian
**VitePress** (via `update docs`). Detects and reports broken links

## Problem

**Tool 1**. Once in a while, i want to clean things up. Some of that is tedious, like merge A into B.
**Tool 2.** Moving files around (by hand or with tools) creates dead links. I need to ask of Claude just one thing: [Fix all broken links](#when-i-say-fix-broken-links) and call it from `update docs`. This should NOT move or rename files

## But wait

The rest of these feel less needed, add extra code and testing. are any of them vital? Perhaps #1 is going to be useful?

1. [I moved foo.md from guides to guides/advanced](#when-i-say-i-moved-foomd-from-guides-to-guidesadvanced)
2. [Move foo.md from guides to guides/advanced](#when-i-say-move-foomd-from-guides-to-guidesadvanced)
3. [I created foo.md at notes/guides/advanced](#when-i-say-i-created-foomd-at-notesguidesadvanced)
4. [Check for broken links](#when-i-say-check-for-broken-links)

## Table of Contents

* [Problem](#problem)
* [Can Obsidian do any of this?](#can-obsidian-do-any-of-this)
* [I need to ask of Claude](#i-need-to-ask-of-claude)
* [Solution: Two Tools](#solution-two-tools)
  * [move-doc](#1-move-doc---proactive-mover)
  * [fix-links](#2-fix-links---link-scanner--fixer)
* [Implementation](#implementation)
* [Progress Tracker](#progress-tracker)

## Can any of our ecosystem do any of this?

**What Obsidian can do:**

* Auto-updates wikilinks (`[[file]]`) when renaming/moving files within Obsidian

**What VitePress can do** (via `update docs`):

* Detects and reports broken links

**What's left? We handle all of it:**

* By deploying two tools, that...
* Update `.vitepress/config.mts`
* Fix broken links automatically
* Move files with link updates

## Two Tools

One tool for moving files, the other for repairing links.

### 1. `move-doc` - Proactive Mover

Moves files and updates all references automatically.

**Usage:**

```bash
move-doc old/path.md new/path.md
move-doc --do old/path.md new/path.md
move-doc --merge file1.md file2.md destination.md
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
fix-links              # Fix without confirmation (reads vitepress.build.txt)
fix-links --yes        # Fix with confirmation
fix-links --scan       # Just show what would be fixed
fix-links --add <path> # update config and index
```

#### **What it does:**

- [ ] **Requires that `update docs` is calling this**
- [ ] Finds broken links by reading `.vitepress.build.txt`
- [ ] Option to request confirmation
- [ ] Updates broken links
- [ ] Reports unfixable links

#### **Safety:**

- [ ] Reads broken links from `vitepress.build.txt` (authoritative source)
- [ ] Use `--yes` for confirmation prompts
- [ ] Use `--scan` for dry-run reporting only
- [ ] Shows what would change
- [ ] Relies on git for backups

#### **Use cases:**

*After running `update docs` (default mode - fix without confirmation):*

```bash
# update docs has detected broken links in vitepress.build.txt
# Now fix them automatically
fix-links
# Reads vitepress.build.txt, fixes all broken links
```

##### When I say "Fix broken links":

- [ ] read broken links from `vitepress.build.txt`
- [ ] find moved files by name matching
- [ ] update broken links to point to new locations
- [ ] update VitePress config
- [ ] report any unfixable links

*Show what would be fixed (scan mode):*

```bash
# Just want to see what would be fixed
fix-links --scan
# Shows: Found 12 broken links, here's what would change...
```

##### When I say "Check for broken links":

- [ ] read broken links from `vitepress.build.txt`
- [ ] show what would be fixed
- [ ] do NOT fix anything

*Fix with confirmation:*

```bash
# Fix but ask before each change
fix-links --yes
# Shows each broken link, suggests fix, asks to apply
```

*After creating a new file:*

```bash
# You created notes/designs/work/foo.md
# Need to add it to index and VitePress config
fix-links --add work/foo.md
# Adds file to appropriate index and sidebar
```

##### When I say "I created foo.md at notes/guides/advanced":

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
# Run update docs to detect broken links
yarn docs:build
# Run fix-links to repair automatically
fix-links
# Verify:
# - Broken link detected from vitepress.build.txt
# - Correct new location found
# - Link updated automatically
# - VitePress config updated
```

*Batch scenario:*

```bash
# Manually reorganize multiple files
mv guides/file1.md guides/advanced/
mv guides/file2.md architecture/
mv guides/file3.md guides/basics/
# Run update docs to detect all broken links
yarn docs:build
# Run fix-links to repair all automatically
fix-links
# Verify:
# - All broken links found in vitepress.build.txt
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

**Option 1: Automatic fix with fix-links**
- [ ] Run `yarn docs:build` (which creates `vitepress.build.txt`)
- [ ] Run `fix-links` to automatically fix broken links
- [ ] Optionally use `fix-links --scan` to preview first
- [ ] Then run `yarn docs:build` again to verify

**Option 2: Generate batch move-doc commands**
- [ ] Run `yarn docs:build` (which creates `vitepress.build.txt`)
- [ ] Run `node notes/tools/generate-move-commands.ts --write batch.sh`
- [ ] Review the generated `batch.sh` file
- [ ] Execute `./batch.sh` to perform all moves at once
- [ ] Run `yarn docs:build` again to verify

## Next Action

Build `move-doc` first (highest value).

## Progress Tracker

Major goal is to track decisions and effort. This material must be kept in sync with everything relevant to it.

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
  * test1.md (with links to test2.md)
  * test2.md (to be moved)
  * subfolder/ (target directory)

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

**Status: COMPLETE** - Ready for testing on fixtures

### Building fix-links

**Step 1: Design complete**

- [x] Spec'd out all use cases
- [x] Defined command line interface
- [x] Documented batch processing flow
- [x] Created test scenarios

**Step 2: Implementation**

- [ ] Set up project structure
- [ ] Parse `vitepress.build.txt` for broken links
- [ ] File matching to find moved files
- [ ] Link repair in markdown files
- [ ] VitePress config updating
- [ ] `--add` flag for new files
- [ ] `--yes` flag for confirmation prompts
- [ ] `--scan` flag for dry-run
- [ ] Summary reporting

**Step 3: Testing**

- [ ] Create test fixtures
- [ ] Test single broken link scenario
- [ ] Test batch scenario
- [ ] Test `--add` functionality

**Status: NOT STARTED** - Design complete, implementation pending

### Building generate-move-commands

**Status: COMPLETE** - Helper tool to generate batch move-doc commands

**What it does:**
1. Parses `vitepress.build.txt` for dead link errors
2. Finds possible file matches in the docs directory
3. Generates `move-doc` commands for each broken link
4. Can write to a batch script for review and execution

**Usage:**
```bash
node notes/tools/generate-move-commands.ts                    # Show proposed commands
node notes/tools/generate-move-commands.ts --write batch.sh   # Write to script file
```

**Output example:**
```bash
move-doc "guides/debugging.md" "guides/advanced/debugging.md"  # Fix link in index.md
move-doc "api/old-api.md" "api/v2/old-api.md"  # Fix link in getting-started.md
```