'use strict';
/* jshint -W018 */


class Char {


	/**
	 * A character which can move around.
	 * @constructor
	 * @param {number} x - X index on map.
	 * @param {number} y - Y index on map.
	 */
	constructor( x, y ) {
		this.x = x;
		this.y = y;

		this.s = g.k.sprite( {
			x: x * g.tw,
			y: y * g.tw,
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

		this.s.x = this.x * g.tw;
		this.s.y = this.y * g.tw;
	}


}


/**
 * Get a certain canvas element and its 2D context.
 * @param  {string} id
 * @return {Array} Canvas and 2D context.
 */
function getCanvasAndCtx( id ) {
	let canvas = document.getElementById( id );
	canvas.width = g.mc;
	canvas.height = g.mr;

	let ctx = canvas.getContext( '2d' );
	ctx.imageSmoothingEnabled = false;

	return [canvas, ctx];
}



( () => {
	// Shortcuts.

	window.g = {
		rnd: Math.random,
		k: kontra,
		mc: 64, // number of map columns
		mr: 64, // number of map rows
		tw: 32, // default tile width (and height) [px]
		ww: window.innerWidth, // window width
		wh: window.innerHeight // window height
	};

	// Adjust tile size so the whole map
	// is contained in the browser window.
	let twContainX = ~~( g.ww / g.mc );
	let twContainY = ~~( g.wh / g.mc );
	g.tw = Math.max( g.tw, Math.max( twContainX, twContainY ) );

	g.mw = g.mc * g.tw; // map width [px]
	g.mh = g.mr * g.tw; // map height [px]


	// Generate map.

	let map = new Array( g.mc * g.mr );
	map.fill( 2 );
	g.map = map;

	// Place stones. ~3% of map should be stone.
	let numStones = map.length * 0.03;

	while( numStones-- > 0 ) {
		map[~~( g.rnd() * map.length )] = 4;
	}

	// Generate static ground. For performance
	// reasons render all the tiles only once
	// and create a new image, which is then used
	// and just moved around.

	let [groundCanvas, groundCtx] = getCanvasAndCtx( 'ground' );
	let tiles = [];
	let y = 0;

	map.forEach( ( v, i ) => {
		let x = i % g.mc;
		let green = 90 + g.rnd() * 20;

		groundCtx.fillStyle = ( v & 4 ) ? 'rgb(40,40,40)' : `rgb(18,${~~green},40)`;
		groundCtx.fillRect( x, y, 1, 1 );

		y += !( ++i % g.mc );
	} );


	// Now create a fog overlay.
	// The generated image will only be 1/4 and
	// will be to the bottom right of the player.
	//
	// We will then render it 4 times and just
	// flip it around to cover the other sides.

	let [fogCanvas, fogCtx] = getCanvasAndCtx( 'fog' );

	for( let y = 0; y < g.mr; y++ ) {
		for( let x = 0; x < g.mc; x++ ) {
			// Euclidean distance from origin.
			let de = Math.sqrt( x * x + y * y );

			let f = 1 - Math.min( 3 / de, 1 );
			fogCtx.fillStyle = `rgba(0,0,0,${f})`;
			fogCtx.fillRect( x, y, 1, 1 );
		}
	}


	// Initialize again, this time with the main canvas.

	g.k.init();
	g.k.canvas.width = g.ww;
	g.k.canvas.height = g.wh;
	g.k.context.imageSmoothingEnabled = false;

	let ground = g.k.sprite( { image: groundCanvas } );
	let fog = g.k.sprite( { image: fogCanvas } );

	let pStartX = 12;
	let pStartY = 12;
	let player = new Char( pStartX, pStartY );

	g.k.keys.bind( 'left', () => player.mv( -1, 0 ) );
	g.k.keys.bind( 'right', () => player.mv( 1, 0 ) );
	g.k.keys.bind( 'up', () => player.mv( 0, -1 ) );
	g.k.keys.bind( 'down', () => player.mv( 0, 1 ) );

	let pSX = pStartX * g.tw;
	let pSY = pStartY * g.tw;
	let fogOffsetX = -pSX;
	let fogOffsetY = -pSY;

	// Source and destination areas for fog images.
	let sourceCut = [1, 1, g.mc - 1, g.mr - 1];
	let dest = [0, 0, g.mw, g.mh];
	let destCut = [g.tw, g.tw, g.mw - g.tw, g.mh - g.tw];

	let wwHalf = g.ww / 2;
	let whHalf = g.wh / 2;

	let loop = g.k.gameLoop( {

		update: () => {
			player.s.update();
		},

		render: () => {
			let ctx = g.k.context;
			ctx.save();


			// Center on player, but stop at borders.

			let cx = wwHalf - player.s.x;
			cx = Math.max( Math.min( cx, 0 ), g.ww - g.mw );

			let cy = whHalf - player.s.y;
			cy = Math.max( Math.min( cy, 0 ), g.wh - g.mh );

			ctx.translate( ~~cx, ~~cy );


			// Draw the ground image but upscale it.
			// The tiles in the original are only 1x1 px.
			ctx.drawImage( ground.image, ...dest );


			// Draw the characters.
			player.s.render();
			ctx.translate( player.s.x, player.s.y );


			// Draw the fog.

			// Bottom right.
			ctx.save();
			ctx.translate(
				fogOffsetX + pSX,
				fogOffsetY + pSY
			);
			ctx.drawImage( fog.image, ...sourceCut, ...destCut );
			ctx.restore();

			// Bottom left.
			ctx.save();
			ctx.translate(
				fogOffsetX + pSX + g.tw,
				fogOffsetY + pSY
			);
			ctx.scale( -1, 1 );
			ctx.drawImage( fog.image, ...dest );
			ctx.restore();

			// Top right.
			ctx.save();
			ctx.translate(
				fogOffsetX + pSX,
				fogOffsetY + pSY + g.tw
			);
			ctx.scale( 1, -1 );
			ctx.drawImage( fog.image, ...dest );
			ctx.restore();

			// Top left.
			ctx.save();
			ctx.translate(
				fogOffsetX + pSX + g.tw,
				fogOffsetY + pSY + g.tw
			);
			ctx.scale( -1, -1 );
			ctx.drawImage( fog.image, ...sourceCut, ...destCut );
			ctx.restore();


			ctx.restore();
		}

	} );

	loop.start();
} )();
