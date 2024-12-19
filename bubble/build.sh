#! /bin/sh

cd ..
echo "building webseriously in: $(pwd)"
yarn run build >/dev/null 2>&1
cd -
echo "compiling extractor in: $(pwd)"
tsc extractor.ts >/dev/null 2>&1
mv extractor.js ../dist/extractor.cjs
cp webseriously.html ../dist		# dist was recreated by build  webseriously.html
cd ../dist
echo "running extractor in: $(pwd)"
echo ++++++++++++++++++++++++++++++
node extractor.cjs
echo ++++++++++++++++++++++++++++++
rm extractor.*
