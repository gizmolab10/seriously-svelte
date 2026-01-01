#!/bin/bash

# Update Docs Workflow
# Builds VitePress documentation and automatically fixes broken links

cd /Users/sand/GitHub/webseriously

echo "=================================================="
echo "UPDATE DOCS WORKFLOW"
echo "=================================================="
echo ""

# Step 1: Build VitePress documentation
echo "Step 1: Building VitePress documentation..."
yarn docs:build > vitepress.build.txt 2>&1

if [ $? -ne 0 ]; then
  echo "❌ VitePress build failed"
  cat vitepress.build.txt
  exit 1
fi

echo "✅ VitePress build successful"
echo ""

# Step 2: Compile TypeScript tools
echo "Step 2: Compiling TypeScript tools..."
cd notes/tools
npx tsc

if [ $? -ne 0 ]; then
  echo "❌ TypeScript compilation failed"
  exit 1
fi

echo "✅ TypeScript compiled successfully"
echo ""

# Step 3: Run fix-links tool
echo "Step 3: Running fix-links tool..."
cd ../..
node notes/tools/dist/fix-links.js

FIX_LINKS_EXIT=$?

if [ $FIX_LINKS_EXIT -eq 0 ]; then
  echo ""
  echo "✅ All links fixed successfully"
elif [ $FIX_LINKS_EXIT -eq 2 ]; then
  echo ""
  echo "⚠️  Some links could not be fixed (unfixable)"
  echo "Please review the output above"
else
  echo ""
  echo "❌ Link fixing failed"
  exit 1
fi

echo ""
echo "=================================================="
echo "UPDATE DOCS COMPLETE"
echo "=================================================="
