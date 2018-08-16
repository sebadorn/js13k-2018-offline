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

			return;
		}

		this.s.x += x * g.tw;
		this.s.y += y * g.tw;
	}


}


class Tile {


	/**
	 *
	 * @constructor
	 * @param {number} t  - Underground type.
	 * @param {number} xi - X index on map.
	 * @param {number} yi - Y index on map.
	 * @param {number} x  - X coord [px].
	 * @param {number} y  - Y coord [px].
	 */
	constructor( t, xi, yi, x, y ) {
		this.x = xi;
		this.y = yi;

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
	update( player ) {
		let dx = Math.abs( player.x - this.x );
		let dy = Math.abs( player.y - this.y );

		// Update fog.
		this.s.color = this.c;

		if( dx > 2 || dy > 2 || dx + dy == 4 ) {
			let f = 0.1;

			if( dx > 5 || dy > 5 || dx + dy > 8 ) {
				f = 0.05;
			}

			let c = this.c.substr( 4, this.c.length - 5 ).split( ',' );
			c = c.map( v => ~~( v * f ) );

			this.s.color = `rgb(${c.join( ',' )})`;
		}

		this.s.update();
	}


}



( () => {
	// Shortcuts.
	window.g = {
		rnd: Math.random,
		k: kontra,
		mc: 48, // number of map columns
		mr: 30, // number of map rows
		tw: 32, // tile width (and height) [px]
		ww: window.innerWidth, // window width
		wh: window.innerHeight // window height
	};


	// Generate map.
	let map = new Array( g.mc * g.mr );
	map.fill( 2 );
	g.map = map;

	// Place stones.
	for( let i = 0; i < 30; i++ ) {
		map[~~( g.rnd() * g.map.length )] = 4;
	}


	// Setup
	g.k.init();
	g.k.canvas.width = g.ww;
	g.k.canvas.height = g.wh;

	let tiles = [];
	let yi = 0;
	let x = ~~( ( g.ww - g.mc * g.tw ) / 2 );
	let y = ~~( ( g.wh - g.mr * g.tw ) / 2 );

	map.forEach( ( v, i ) => {
		let xi = i % g.mc;

		tiles.push(
			new Tile(
				v,
				xi, yi,
				x + g.tw * xi,
				y + g.tw * yi
			)
		);

		yi += !( ++i % g.mc );
	} );

	let player = new Char(
		10, 10,
		x + g.tw * 10,
		y + g.tw * 10
	);

	g.k.keys.bind( 'left', () => player.mv( -1, 0 ) );
	g.k.keys.bind( 'right', () => player.mv( 1, 0 ) );
	g.k.keys.bind( 'up', () => player.mv( 0, -1 ) );
	g.k.keys.bind( 'down', () => player.mv( 0, 1 ) );

	let loop = g.k.gameLoop( {

		update: () => {
			tiles.forEach( t => t.update( player ) );
			player.s.update();
		},

		render: () => {
			tiles.forEach( t => t.s.render() );
			player.s.render();
		}

	} );

	loop.start();
} )();
