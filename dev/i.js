'use strict';
/* jshint -W018 */


class Char {


	/**
	 *
	 * @constructor
	 * @param {number} xi - X index on map.
	 * @param {number} yi - Y index on map.
	 * @param {number} x  - X coord [px].
	 * @param {number} y  - Y coord [px].
	 */
	constructor( xi, yi, x, y ) {
		this.x = xi;
		this.y = yi;

		this.s = g.k.sprite( {
			x,
			y,
			color: '#FFFFFF',
			width: g.tw,
			height: g.tw
		} );
	}


	/**
	 * Move the character.
	 * @param {number} x - X index change on map.
	 * @param {number} y - Y index change on map.
	 */
	mv( x, y ) {
		this.x += x;
		this.y += y;

		let t = g.map[this.y * g.mc + this.x];

		// Not passable terrain or outside bounds.
		if(
			t & 4 ||
			this.x < 0 ||
			this.y < 0 ||
			this.x >= g.mc ||
			this.y >= g.mr
		) {
			this.x -= x;
			this.y -= y;
		}
	}


}


class Tile {


	/**
	 *
	 * @constructor
	 * @param {number} t - Underground type.
	 * @param {number} x - X coord [px] and X index on the map.
	 * @param {number} y - Y coord [px] and Y index on the map.
	 */
	constructor( t, x, y ) {
		this.x = x;
		this.y = y;

		// Type:
		// 2 - Grass, walkable.
		// 4 - Stone, blockade.
		this.t = t;

		this.c = this.color();

		// Sprite.
		this.s = g.k.sprite( {
			x, y,
			color: this.c,
			width: g.tw,
			height: g.tw
		} );
	}


	/**
	 *
	 * @return {string}
	 */
	color() {
		if( this.t & 4 ) {
			return 'rgb(40,40,40)';
		}

		let gr = 90 + g.rnd() * 30;
		let c = `rgb(18,${~~gr},45)`;

		return c;
	}


	/**
	 * Update the tile.
	 * @param {Char} player
	 */
	toShadow( player ) {
		// Update fog.

		// Distance of tile to the player.
		let dx = Math.abs( player.x - this.x );
		let dy = Math.abs( player.y - this.y );
		// Euclidean distance.
		let de = Math.sqrt( dx * dx + dy * dy );

		// Start the fog (darken a tile) starting
		// at 3 fields from the player.
		let f = Math.min( 3 / de, 1 );

		// c = c.map( v => ~~( v * f ) );

		this.s.color = `rgba(0,0,0,0.5)`;


		// Update position. Move so the
		// player is always in the center.
		this.s.x = this.x - player.x;
		this.s.y = this.y - player.y;


		this.s.update();
	}


}



( () => {
	// Shortcuts.
	window.g = {
		rnd: Math.random,
		k: kontra,
		mc: 20, // number of map columns
		mr: 20, // number of map rows
		tw: 32, // tile width (and height) [px]
		ww: window.innerWidth, // window width
		wh: window.innerHeight // window height
	};
	g.mw = g.mc * g.tw; // map width [px]
	g.mh = g.mr * g.tw; // map height [px]


	// Generate map.
	let map = new Array( g.mc * g.mr );
	map.fill( 2 );
	g.map = map;

	// Place stones.
	for( let i = 0; i < 30; i++ ) {
		map[~~( g.rnd() * g.map.length )] = 4;
	}


	// Generate static ground. For performance
	// reasons render all the tiles only once
	// and create a new image, which is then used
	// and just moved around.

	g.k.init( document.getElementById( 'ground' ) );
	g.k.canvas.width = g.mc;
	g.k.canvas.height = g.mr;
	g.k.context.imageSmoothingEnabled = false;

	let tiles = [];
	let yi = 0;

	g.xoff = ~~( ( g.ww - g.tw ) / 2 );
	g.yoff = ~~( ( g.wh - g.tw ) / 2 );

	map.forEach( ( v, i ) => {
		let xi = i % g.mc;
		tiles.push( new Tile( v, xi, yi ) );
		yi += !( ++i % g.mc );
	} );

	tiles.forEach( t => { t.s.render(); } );

	let groundCanvas = g.k.canvas;


	// Now create a shadow overlay.

	let shadowCanvas = document.getElementById( 'shadow' );
	shadowCanvas.width = g.mc;
	shadowCanvas.height = g.mr;

	let shadowCtx = shadowCanvas.getContext( '2d' );
	shadowCtx.imageSmoothingEnabled = false;

	for( let y = 0; y < g.mr; y++ ) {
		for( let x = 0; x < g.mc; x++ ) {
			// Distance of tile to the player.
			let dx = Math.abs( 10 - x );
			let dy = Math.abs( 10 - y );
			// Euclidean distance.
			let de = Math.sqrt( dx * dx + dy * dy );

			// Start the fog (darken a tile) starting
			// at 3 fields from the player.
			let f = 1 - Math.min( 3 / de, 1 );

			shadowCtx.fillStyle = `rgba(0,0,0,${f})`;
			shadowCtx.fillRect( x, y, 1, 1 );
		}
	}


	// Initialize again, this time with the main canvas.

	g.k.init();
	g.k.canvas.width = g.ww;
	g.k.canvas.height = g.wh;
	g.k.context.imageSmoothingEnabled = false;

	let ground = g.k.sprite( { image: groundCanvas } );
	let shadow = g.k.sprite( { image: shadowCanvas } );

	let player = new Char(0, 0, g.xoff, g.yoff);
	player.mv( 10, 10 );

	g.k.keys.bind( 'left', () => player.mv( -1, 0 ) );
	g.k.keys.bind( 'right', () => player.mv( 1, 0 ) );
	g.k.keys.bind( 'up', () => player.mv( 0, -1 ) );
	g.k.keys.bind( 'down', () => player.mv( 0, 1 ) );

	let loop = g.k.gameLoop( {

		update: () => {
			player.s.update();
		},

		render: () => {
			let overlayX = g.xoff - player.x * g.tw;
			let overlayY = g.yoff - player.y * g.tw;

			// Draw the ground image but upscale it.
			// The tiles in the original are only 1x1px.
			g.k.context.drawImage(
				ground.image,
				overlayX, overlayY,
				g.mw, g.mh
			);

			g.k.context.drawImage(
				shadow.image,
				g.xoff, g.yoff,
				g.mw, g.mh
			);

			player.s.render();
		}

	} );

	loop.start();
} )();
