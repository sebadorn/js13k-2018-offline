'use strict';
/* jshint -W018 */


( () => {


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
			this.path = null;

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
			else {
				this.path = findPath( goal, this );
			}

			this.s.x = this.x * g.tw;
			this.s.y = this.y * g.tw;
		}


	}


	/**
	 * Find a path from a to b.
	 * @param  {object} a
	 * @param  {number} a.x
	 * @param  {number} a.y
	 * @param  {object} b
	 * @param  {number} b.x
	 * @param  {number} b.y
	 * @return {?object[]}
	 */
	function findPath( a, b ) {
		let markFieldsAround = ( x, y, step ) => {
			let next = [];
			let xp = x + 1;
			let xm = x - 1;
			let yp = y + 1;
			let ym = y - 1;


			// Check if there is a field in the 4 directions
			// and if there is one, if it can be walked on.
			//
			// Also do not check already checked fields again.
			// Since we first check all low-number (step) fields,
			// we cannot find a shorter path at a later point.

			// To the right.
			if(
				xp < g.mc && !m2[xp][y] &&
				g.map[y * g.mc + xp] & 2
			) {
				m2[xp][y] = step;
				next.push( { x: xp, y, step } );
			}

			// To the left.
			if(
				x > 0 && !m2[xm][y] &&
				g.map[y * g.mc + xm] & 2
			) {
				m2[xm][y] = step;
				next.push( { x: xm, y, step } );
			}

			// Look below.
			if(
				yp < g.mr && !m2[x][yp] &&
				g.map[yp * g.mc + x] & 2
			) {
				m2[x][yp] = step;
				next.push( { x, y: yp, step } );
			}

			// Look above.
			if(
				y > 0 && !m2[x][ym] &&
				g.map[ym * g.mc + x] & 2
			) {
				m2[x][ym] = step;
				next.push( { x, y: ym, step } );
			}

			return next;
		};

		// 2D array as map.
		let m2 = Array( g.mc );

		for( let i = 0; i < g.mc; i++ ) {
			m2[i] = Array( g.mr ).fill( 0 );
		}

		m2[a.x][a.y] = 1;

		// Explore all the connected fields, starting from
		// position "a". Stop when all paths are exhausted
		// or a connection to "b" has been found.
		let nextFields = [{ x: a.x, y: a.y, step: 1 }];
		let steps = 0;

		while( nextFields.length ) {
			let n = nextFields.splice( 0, 1 )[0];

			if( n.x == b.x && n.y == b.y ) {
				steps = n.step;
				break;
			}

			nextFields = nextFields.concat(
				markFieldsAround( n.x, n.y, n.step + 1 )
			);
		}

		if( !steps ) {
			return null;
		}

		// There is at least 1 connection. Now gather the path.
		// We start at the end, position "b".
		let path = [b];
		let x = b.x;
		let y = b.y;

		while( --steps ) {
			let field = null;

			if( x > 0 ) {
				field = m2[x - 1][y];

				if( field == steps ) {
					path.push( { x: x - 1, y } );
					x--;
					continue;
				}
			}

			if( x < g.mc - 1 ) {
				field = m2[x + 1][y];

				if( field == steps ) {
					path.push( { x: x + 1, y } );
					x++;
					continue;
				}
			}

			if( y > 0 ) {
				field = m2[x][y - 1];

				if( field == steps ) {
					path.push( { x, y: y - 1 } );
					y--;
					continue;
				}
			}

			if( y < g.mr - 1 ) {
				field = m2[x][y + 1];

				if( field == steps ) {
					path.push( { x, y: y + 1 } );
					y++;
					continue;
				}
			}
		}

		return path;
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


	/**
	 * Get a starting position for a monster.
	 * @return {number[]}
	 */
	function getMonsterStartPos() {
		let x = ~~( g.rnd() * g.mc );
		let y = ~~( g.rnd() * g.mr );

		// TODO:

		return [x, y];
	}


	/**
	 * Get a starting position for the player.
	 * It has to be at least a certain distance from
	 * the goal and there has to be a path to the
	 * goal. The game is not allowed to be impossible!
	 * @return {Array}
	 */
	function getPlayerStartPos() {
		// Never start directly at the border.
		let x = 2 + ~~( g.rnd() * ( g.mc - 4 ) );
		let y = 2 + ~~( g.rnd() * ( g.mr - 4 ) );

		// Invalid position: If same as goal
		// or no path to the goal exists.
		if(
			( x == goal.x && y == goal.y ) ||
			!findPath( goal, { x, y } )
		) {
			return getPlayerStartPos();
		}

		let index = y * g.mc + x;

		// Make sure the starting point is walkable.
		g.map[index] = 2;

		return [x, y];
	}


	// Shortcuts.

	window.g = {
		isAtGoal: false,
		rnd: Math.random,
		k: kontra,
		mc: 128, // number of map columns
		mr: 128, // number of map rows
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


	// Place the goal.
	// Make sure it has some minimum
	// margin to the map borders.

	let goal = {
		x: 2 + ~~( g.rnd() * ( g.mc - 4 ) ),
		y: 2 + ~~( g.rnd() * ( g.mr - 4 ) )
	};

	map[goal.y * g.mc + goal.x] = 8;



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
		let c = `rgb(18,${~~green},40)`;

		// Stone.
		if( v & 4 ) {
			c = '#282828';
		}
		// Goal.
		else if( v & 8 ) {
			c = '#29BEB2';
		}

		groundCtx.fillStyle = c;
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

	let [pStartX, pStartY] = getPlayerStartPos();
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
	let centerLimitW = g.ww - g.mw;
	let centerLimitH = g.wh - g.mh;
	let twHalf = g.tw / 2;
	let lw = ~~( g.tw / 10 );
	let ctx = g.k.context;

	player.path = findPath( goal, player );

	let loop = g.k.gameLoop( {

		update: () => {
			if( player.x == goal.x && player.y == goal.y && !g.isAtGoal ) {
				g.isAtGoal = true;
				window.alert( '!' ); // TODO:
			}

			player.s.update();
		},

		render: () => {
			ctx.save();


			// Center on player, but stop at borders.

			let cx = wwHalf - player.s.x;
			cx = ( cx > 0 ) ? 0 : cx;
			cx = ( cx < centerLimitW ) ? centerLimitW : cx;

			let cy = whHalf - player.s.y;
			cy = ( cy > 0 ) ? 0 : cy;
			cy = ( cy < centerLimitH ) ? centerLimitH : cy;

			ctx.translate( ~~cx, ~~cy );


			// Draw the ground image but upscale it.
			// The tiles in the original are only 1x1 px.
			ctx.drawImage( ground.image, ...dest );


			// Draw the characters.
			player.s.render();

			if( player.path ) {
				ctx.beginPath();
				ctx.strokeStyle = '#6BBEE1';
				ctx.lineWidth = lw;
				ctx.lineJoin = 'miter';

				let pp = player.path;
				let step = pp[0];

				ctx.moveTo(
					step.x * g.tw + twHalf,
					step.y * g.tw + twHalf
				);

				for( let i = 1; i < pp.length; i++ ) {
					step = pp[i];

					ctx.lineTo(
						step.x * g.tw + twHalf,
						step.y * g.tw + twHalf
					);
				}

				ctx.stroke();
			}

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
