#!/bin/bash

echo "=== WEBSERIOUSLY APP - LINE COUNT ANALYSIS ==="
echo ""

echo "=== FILE COUNT BY TYPE ==="
echo "TypeScript files: $(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "Svelte files: $(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "JavaScript files: $(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "HTML files: $(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "CSS/SCSS files: $(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "JSON files: $(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "Shell scripts: $(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "Markdown files: $(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "Config files: $(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo ""

echo "=== LINE COUNT BY TYPE (excluding auto-generated files) ==="
echo "TypeScript files: $(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "Svelte files: $(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "JavaScript files: $(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "HTML files: $(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "CSS/SCSS files: $(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "JSON files (excluding lock files): $(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "Shell scripts: $(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "Markdown files: $(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo "Config files: $(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo ""

echo "=== TOTAL COUNTS ==="
echo "Total files: $(find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.svelte" -o -name "*.vue" -o -name "*.html" -o -name "*.css" -o -name "*.scss" -o -name "*.less" -o -name "*.json" -o -name "*.md" -o -name "*.sh" -o -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l)"
echo "Total lines (excluding lock files): $(find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.svelte" -o -name "*.vue" -o -name "*.html" -o -name "*.css" -o -name "*.scss" -o -name "*.less" -o -name "*.json" -o -name "*.md" -o -name "*.sh" -o -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec wc -l {} + | tail -1 | awk '{print $1}')"
echo ""

echo "=== CODE FOCUSED COUNT (TypeScript + Svelte + JavaScript) ==="
TS_LINES=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
SVELTE_LINES=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
JS_LINES=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
TOTAL_CODE=$((TS_LINES + SVELTE_LINES + JS_LINES))
echo "TypeScript: $TS_LINES lines"
echo "Svelte: $SVELTE_LINES lines"
echo "JavaScript: $JS_LINES lines"
echo "Total code lines: $TOTAL_CODE lines"
echo ""

echo "=== LARGEST FILES ==="
find . \( -name "*.ts" -o -name "*.svelte" -o -name "*.js" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | sort -nr | head -10 