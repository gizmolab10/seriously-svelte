#! /bin/sh

cd ..
echo "working in: $(pwd)"
echo "building webseriously..."
yarn run build >/dev/null 2>&1
cd -
echo "returned to: $(pwd)"
cp extractor.ts ../dist		# dist was recreated by build
cd ../dist
echo "working in: $(pwd)"
echo "compiling extractor..."
tsc extractor.ts >/dev/null 2>&1
mv extractor.js extractor.cjs
echo "running extractor..."
echo ++++++++++++++++++++++++++++++
node extractor.cjs
echo ++++++++++++++++++++++++++++++
rm extractor.*
