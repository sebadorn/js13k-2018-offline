#!/usr/bin/env bash

cd $(dirname "$0")

TERSER="$HOME/.node/bin/terser"

if [ -d 'build' ]; then
	rm -r 'build'
fi

mkdir 'build'
mkdir 'build/assets'

cp 'dev/index-dev.html' 'build/'
cp dev/*.js 'build/'
cp dev/assets/*.png 'build/assets/'

cd 'build' > '/dev/null'

tr -d '\n' < 'index-dev.html' > 'index.html'
sed -i'' 's/<script src="kontra\.js"><\/script>//' 'index.html'
sed -i'' 's/<script src="Char\.js"><\/script>//' 'index.html'
sed -i'' 's/<script src="PathFinding\.js"><\/script>//' 'index.html'
sed -i'' 's/init\.js/i.js/' 'index.html'

sed -i'' 's/^"use strict";//' 'Char.js'
sed -i'' 's/^"use strict";//' 'PathFinding.js'
sed -i'' 's/^"use strict";//' 'init.js'

$TERSER 'kontra.js' 'Char.js' 'PathFinding.js' 'init.js' \
	--ecma 6 --compress --mangle \
	-o 'i.js'

rm 'index-dev.html'
rm 'kontra.js' 'Char.js' 'PathFinding.js' 'init.js'

zip -q -r offline.zip ./*

echo '  - Max size: 13312 bytes'
stat --printf="  - ZIP size: %s bytes\n" offline.zip

echo '  - Done.'
