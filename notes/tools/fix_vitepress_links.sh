#!/bin/bash

# Script to fix broken links in VitePress markdown files
# Root directory for all markdown files
ROOT="/Users/sand/GitHub/webseriously/notes/designs"

echo "=== VitePress Link Fixing Script ==="
echo ""
echo "This script will fix the following issues:"
echo ""
echo "1. README.md - Add 'notes/designs/' prefix to internal links"
echo "2. guides/digest.md - Change './analysis/' to '../work/'"
echo "3. guides/refactoring.md - Change 'clicks.md' to '../refactor/clicks.md'"
echo "4. guides/documentation.md - Remove localhost URL"
echo "5. guides/vitepress.md - Remove localhost URL"
echo "6. index.md - Fix paths to documentation and analysis files"
echo ""

# Function to backup a file
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup"
        echo "Created backup: ${file}.backup"
    fi
}

# 1. Fix README.md
echo "--- Fixing README.md ---"
FILE="/Users/sand/GitHub/webseriously/README.md"
backup_file "$FILE"

sed -i.tmp '
    s|\[can be found here\](documentation)|[can be found here](notes/designs/documentation)|g
    s|\[architecture/state\.md\](\.\.\/architecture/state\.md)|[architecture/state.md](notes/designs/architecture/state.md)|g
    s|\[architecture/hits\.md\](\.\.\/architecture/hits\.md)|[architecture/hits.md](notes/designs/architecture/hits.md)|g
    s|\[analysis/layout-guide\.md\](layout\.md)|[analysis/layout-guide.md](notes/designs/refactor/layout.md)|g
    s|\[analysis/geometry\.md\](geometry\.md)|[analysis/geometry.md](notes/designs/architecture/geometry.md)|g
    s|\[guides/style\.md\](\.\.\/guides/style\.md)|[guides/style.md](notes/designs/guides/style.md)|g
    s|\[guides/debugging\.md\](\.\.\/guides/debugging\.md)|[guides/debugging.md](notes/designs/guides/debugging.md)|g
    s|\[guides/gotchas\.md\](\.\.\/guides/gotchas\.md)|[guides/gotchas.md](notes/designs/guides/gotchas.md)|g
    s|\[refactoring\.md\](refactoring\.md)|[refactoring.md](notes/designs/guides/refactoring.md)|g
' "$FILE"
rm "${FILE}.tmp"
echo "Fixed README.md"
echo ""

# 2. Fix guides/digest.md
echo "--- Fixing guides/digest.md ---"
FILE="$ROOT/guides/digest.md"
backup_file "$FILE"

sed -i.tmp '
    s|\./analysis/breadcrumbs|../work/breadcrumbs re-compositioon|g
    s|\./analysis/focus|../work/focus|g
    s|\./analysis/geometry|../architecture/geometry|g
    s|\./analysis/refactor-clicks|../refactor/clicks|g
    s|\./analysis/timers|../work/timers|g
    s|\./analysis/widget_title|../work/widget_title|g
' "$FILE"
rm "${FILE}.tmp"
echo "Fixed guides/digest.md"
echo ""

# 3. Fix guides/refactoring.md
echo "--- Fixing guides/refactoring.md ---"
FILE="$ROOT/guides/refactoring.md"
backup_file "$FILE"

sed -i.tmp 's|(clicks\.md)|(../refactor/clicks.md)|g' "$FILE"
rm "${FILE}.tmp"
echo "Fixed guides/refactoring.md"
echo ""

# 4. Fix guides/documentation.md - Remove localhost link
echo "--- Fixing guides/documentation.md ---"
FILE="$ROOT/guides/documentation.md"
backup_file "$FILE"

sed -i.tmp 's|http://localhost:5174/index|/index|g' "$FILE"
rm "${FILE}.tmp"
echo "Fixed guides/documentation.md"
echo ""

# 5. Fix guides/vitepress.md - Remove localhost link
echo "--- Fixing guides/vitepress.md ---"
FILE="$ROOT/guides/vitepress.md"
backup_file "$FILE"

sed -i.tmp 's|http://localhost:5173|/|g' "$FILE"
rm "${FILE}.tmp"
echo "Fixed guides/vitepress.md"
echo ""

# 6. Fix index.md
echo "--- Fixing index.md ---"
FILE="$ROOT/index.md"
backup_file "$FILE"

sed -i.tmp '
    s|\./notes/designs/documentation|./documentation|g
    s|\./analysis/index|./work/index|g
' "$FILE"
rm "${FILE}.tmp"
echo "Fixed index.md"
echo ""

echo "=== All fixes applied ==="
echo ""
echo "Backup files created with .backup extension"
echo "Run 'yarn docs:build' to verify fixes"
