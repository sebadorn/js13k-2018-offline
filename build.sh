#!/usr/bin/env bash

cd $(dirname "$0")

TERSER="$HOME/.node/bin/terser"

if [ -d 'build' ]; then
	rm -r 'build'
fi

mkdir 'build'

cp 'dev/index.html' 'build/index.html'
cp dev/*.js 'build/'

cd 'build' > '/dev/null'
$TERSER 'i.js' --ecma 6 --compress --mangle -o 'i.js'
sed -i'' 's/^"use strict";//' 'i.js'

zip -q -r offline.zip ./*

echo '  - Max size: 13312 bytes'
stat --printf="  - ZIP size: %s bytes\n" offline.zip

echo '  - Done.'
