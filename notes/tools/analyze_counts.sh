#!/bin/bash

echo "=== WEBSERIOUSLY APP - ANALYSIS COUNTS ==="
echo ""

echo "=== COUNTS BY TYPE (Files / Lines / Words) ==="

# Total number of find operations
TOTAL_FINDS=27
CURRENT=0

printf "Collecting data: 0 of $TOTAL_FINDS"

# Collect all metrics for each file type
TS_FILES=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
TS_LINES=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
TS_WORDS=$(find . -name "*.ts" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

SVELTE_FILES=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SVELTE_LINES=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SVELTE_WORDS=$(find . -name "*.svelte" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

JS_FILES=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JS_LINES=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JS_WORDS=$(find . -name "*.js" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

HTML_FILES=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
HTML_LINES=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
HTML_WORDS=$(find . -name "*.html" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

CSS_FILES=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CSS_LINES=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CSS_WORDS=$(find . \( -name "*.css" -o -name "*.scss" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

JSON_FILES=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JSON_LINES=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
JSON_WORDS=$(find . -name "*.json" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -not -name "package-lock.json" -not -name "yarn.lock" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

SH_FILES=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SH_LINES=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
SH_WORDS=$(find . -name "*.sh" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

MD_FILES=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
MD_LINES=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
MD_WORDS=$(find . -name "*.md" -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

CONFIG_FILES=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" | wc -l); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CONFIG_LINES=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"
CONFIG_WORDS=$(find . \( -name "*.config.*" -o -name "*.toml" -o -name "*.yml" -o -name "*.yaml" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | tail -1 | awk '{print $1}'); CURRENT=$((CURRENT + 1)); printf "\rCollecting data: $CURRENT of $TOTAL_FINDS"

# Clear the progress line - \r goes to start of line, \033[K clears to end of line
printf "\r\033[K"

# Print combined counts
printf "%8d %8d %8d  TypeScript\n" $TS_FILES $TS_LINES $TS_WORDS
printf "%8d %8d %8d  Svelte\n" $SVELTE_FILES $SVELTE_LINES $SVELTE_WORDS
printf "%8d %8d %8d  JavaScript\n" $JS_FILES $JS_LINES $JS_WORDS
printf "%8d %8d %8d  HTML\n" $HTML_FILES $HTML_LINES $HTML_WORDS
printf "%8d %8d %8d  CSS/SCSS\n" $CSS_FILES $CSS_LINES $CSS_WORDS
printf "%8d %8d %8d  JSON\n" $JSON_FILES $JSON_LINES $JSON_WORDS
printf "%8d %8d %8d  Shell\n" $SH_FILES $SH_LINES $SH_WORDS
printf "%8d %8d %8d  Markdown\n" $MD_FILES $MD_LINES $MD_WORDS
printf "%8d %8d %8d  Config\n" $CONFIG_FILES $CONFIG_LINES $CONFIG_WORDS

# Calculate totals
TOTAL_FILES=$((TS_FILES + SVELTE_FILES + JS_FILES + HTML_FILES + CSS_FILES + JSON_FILES + SH_FILES + MD_FILES + CONFIG_FILES))
TOTAL_LINES=$((TS_LINES + SVELTE_LINES + JS_LINES + HTML_LINES + CSS_LINES + JSON_LINES + SH_LINES + MD_LINES + CONFIG_LINES))
TOTAL_WORDS=$((TS_WORDS + SVELTE_WORDS + JS_WORDS + HTML_WORDS + CSS_WORDS + JSON_WORDS + SH_WORDS + MD_WORDS + CONFIG_WORDS))

# Calculate code-only totals
CODE_FILES=$((TS_FILES + SVELTE_FILES + JS_FILES))
CODE_LINES=$((TS_LINES + SVELTE_LINES + JS_LINES))
CODE_WORDS=$((TS_WORDS + SVELTE_WORDS + JS_WORDS))

# Print separator and totals
echo "-------- -------- --------  ---------"
printf "%8d %8d %8d  TOTAL\n" $TOTAL_FILES $TOTAL_LINES $TOTAL_WORDS
printf "%8d %8d %8d  CODE FILES ONLY (TS+Svelte+JS)\n" $CODE_FILES $CODE_LINES $CODE_WORDS
echo ""

echo "=== FILES WITH LARGEST LINE COUNTS ==="
find . \( -name "*.ts" -o -name "*.svelte" -o -name "*.js" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -l {} + | sort -nr | head -10
echo ""

echo "=== FILES WITH LARGEST WORD COUNTS ==="
find . \( -name "*.ts" -o -name "*.svelte" -o -name "*.js" \) -not -path "./notes/*"  -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./dist/*" -not -path "./.svelte-kit/*" -not -path "./.netlify/*" -not -path "./.obsidian/*" -exec wc -w {} + | sort -nr | head -10
echo ""