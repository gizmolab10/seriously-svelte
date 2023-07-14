#!/bin/sh
file=$1
if [ -f $file.txt ]
then
    rm $file.txt
fi
if [ -f $file.cjs ]
then
    rm $file.cjs
fi
tsc $file.ts
mv $file.js $file.cjs
node $file.cjs > $file.txt
cat $file.txt
