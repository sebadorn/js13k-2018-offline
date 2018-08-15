#!/usr/bin/env bash

cd $(dirname "$0")

TERSER='./.node/bin/terser'

cp 'dev/index.htm' 'build/index.htm'
cp 'dev/k.js' 'build/k.js'

$TERSER 'dev/i.js' --ecma 8 --compress --mangle -o 'build/i.js'

echo '  - Done.'
