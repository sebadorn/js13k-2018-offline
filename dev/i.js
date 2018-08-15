'use strict';


/* jshint -W018 */
( () => {
	let map = [
		0, 0, 0,
		0, 0, 0,
		0, 0, 0
	];


	// Shortcuts.
	window.g = {
		k: kontra,
		mc: 3, // number of map columns
		mr: 3, // number of map rows
		tw: 100, // tile width (and height) [px]
		ww: window.innerWidth, // window width
		wh: window.innerHeight // window height
	};


	// Setup
	g.k.init();
	g.k.canvas.width = g.ww;
	g.k.canvas.height = g.wh;

	let tiles = [];
	let j = 0;
	let x = ~~( ( g.ww - g.mc * g.tw ) / 2 );
	let y = ~~( ( g.wh - g.mr * g.tw ) / 2 );

	map.forEach( ( v, i ) => {
		tiles.push(
			g.k.sprite( {
				x: x + g.tw * ( i % g.mc ),
				y: y + g.tw * j,
				color: 'green',
				width: g.tw,
				height: g.tw
			} )
		);

		j += !( ++i % g.mc );
	} );

	let loop = g.k.gameLoop( {

		update: () => {
			//
		},

		render: () => {
			tiles.forEach( t => t.render() );
		}

	} );

	loop.start();
} )();
