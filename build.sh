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
sed -i'' 's/^"use strict";//' 'Char.js'
sed -i'' 's/^"use strict";//' 'PathFinding.js'
sed -i'' 's/^"use strict";//' 'init.js'
mv 'kontra.js' 'k.js'

$TERSER 'Char.js' 'PathFinding.js' 'init.js' \
	--ecma 6 --compress --mangle \
	-o 'i.js'

rm 'Char.js' 'PathFinding.js' 'init.js'

zip -q -r offline.zip ./*

echo '  - Max size: 13312 bytes'
stat --printf="  - ZIP size: %s bytes\n" offline.zip

echo '  - Done.'
