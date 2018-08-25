'use strict';
/* jshint -W018 */


( () => {


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
	 * @param  {Char}    player
	 * @param  {number} [retry = 0]
	 * @return {number[]}
	 */
	function getMonsterStartPos( player, retry = 0 ) {
		let x = ~~( g.rnd() * g.mc );
		let y = ~~( g.rnd() * g.mr );

		if( x == player.x && y == player.y ) {
			if( retry > 5 ) {
				return null;
			}

			return getMonsterStartPos( player, retry + 1 );
		}

		let index = y * g.mc + x;
		g.map[index] = 2;

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
			!PF.findGoal( x, y )
		) {
			return getPlayerStartPos();
		}

		let index = y * g.mc + x;

		// Make sure the starting point is walkable.
		g.map[index] = 2;

		return [x, y];
	}


	// Global object to use as shortcut
	// for some variables and functions.
	window.g = {
		isAtGoal: false,
		isOnline: false,
		rnd: Math.random,
		mc: 32, // number of map columns
		mr: 32, // number of map rows
		tw: 32, // default tile width (and height) [px]
		ww: window.innerWidth, // window width
		wh: window.innerHeight // window height
	};
	window.k = kontra;

	// Adjust tile size so the whole map
	// is contained in the browser window.
	let twContainX = ~~( g.ww / g.mc );
	let twContainY = ~~( g.wh / g.mc );
	g.tw = Math.max( g.tw, Math.max( twContainX, twContainY ) );

	g.mw = g.mc * g.tw; // map width [px]
	g.mh = g.mr * g.tw; // map height [px]


	// Generate map.
	let map = new Array( g.mc * g.mr );
	g.map = map.fill( 2 );


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
	PF.generateMap( goal.x, goal.y );


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
	let fogMapWidth = Math.ceil( g.ww / g.tw );
	let fogMapHeight = Math.ceil( g.wh / g.tw );

	for( let y = 0; y < fogMapHeight; y++ ) {
		for( let x = 0; x < fogMapWidth; x++ ) {
			// Euclidean distance from origin.
			let de = Math.sqrt( x * x + y * y );

			let f = 1 - Math.min( 3 / de, 1 );
			fogCtx.fillStyle = `rgba(0,0,0,${f})`;
			fogCtx.fillRect( x, y, 1, 1 );
		}
	}


	// Initialize again, this time with the main canvas.

	k.init();
	k.canvas.width = g.ww;
	k.canvas.height = g.wh;
	k.context.imageSmoothingEnabled = false;

	let [pStartX, pStartY] = getPlayerStartPos();
	let player = new Char( pStartX, pStartY );

	k.keys.bind( 'left', () => player.mv( -1, 0 ) );
	k.keys.bind( 'right', () => player.mv( 1, 0 ) );
	k.keys.bind( 'up', () => player.mv( 0, -1 ) );
	k.keys.bind( 'down', () => player.mv( 0, 1 ) );

	// Toggle online mode -> toggle navigation and monster behaviour
	k.keys.bind( 'o', () => {
		g.isOnline = !g.isOnline;
	} );

	// Source and destination areas for fog images.
	let sourceCut = [1, 1, g.mc - 1, g.mr - 1];
	let dest = [0, 0, g.mw, g.mh];
	let destCut = [g.tw, g.tw, g.mw - g.tw, g.mh - g.tw];

	let wwHalf = g.ww / 2;
	let whHalf = g.wh / 2;
	let centerLimitW = g.ww - g.mw;
	let centerLimitH = g.wh - g.mh;
	let twHalf = g.tw / 2;
	let lw = ~~( g.tw / 4 );
	let ctx = k.context;

	// Place monsters. ~0.2% of map should be monsters.
	let numMonsters = map.length * 0.002;
	let monsters = [];

	for( let i = 0; i < numMonsters; i++ ) {
		let pos = getMonsterStartPos( player );
		monsters[i] = new Char( ...pos, 'red' );
	}


	player.path = PF.findGoal( player.x, player.y );

	let loop = k.gameLoop( {

		update: ( dt ) => {
			if( player.x == goal.x && player.y == goal.y && !g.isAtGoal ) {
				g.isAtGoal = true;
				window.alert( '!' ); // TODO:
			}

			player.s.update();

			for( let i = 0; i < numMonsters; i++ ) {
				monsters[i].updateMonster( dt, player );
			}
		},

		render: () => {
			// Center on player, but stop at borders.
			let cx = wwHalf - player.s.x;
			cx = ( cx > 0 ) ? 0 : cx;
			cx = ( cx < centerLimitW ) ? centerLimitW : ~~cx;

			let cy = whHalf - player.s.y;
			cy = ( cy > 0 ) ? 0 : cy;
			cy = ( cy < centerLimitH ) ? centerLimitH : ~~cy;

			ctx.setTransform( 1, 0, 0, 1, cx, cy );


			// Draw the ground image but upscale it.
			// The tiles in the original are only 1x1 px.
			ctx.drawImage( groundCanvas, ...dest );


			// Draw the characters.
			player.s.render();

			for( let i = 0; i < numMonsters; i++ ) {
				monsters[i].s.render();
			}


			// Draw the fog.
			let x = cx + player.s.x;
			let y = cy + player.s.y;
			ctx.setTransform( 1, 0, 0, 1, x, y );

			// Bottom right.
			ctx.drawImage( fogCanvas, ...sourceCut, ...destCut );

			// Bottom left.
			ctx.setTransform( -1, 0, 0, 1, x + g.tw, y );
			ctx.drawImage( fogCanvas, ...dest );

			// Top right.
			ctx.setTransform( 1, 0, 0, -1, x, y + g.tw );
			ctx.drawImage( fogCanvas, ...dest );

			// Top left.
			ctx.setTransform( -1, 0, 0, -1, x + g.tw, y + g.tw );
			ctx.drawImage( fogCanvas, ...sourceCut, ...destCut );


			// Draw the navigation path.
			ctx.setTransform( 1, 0, 0, 1, cx, cy );
			let pp = player.path;

			if( pp && pp.length > 2 && g.isOnline ) {
				ctx.beginPath();
				ctx.strokeStyle = '#6BBEE1';
				ctx.lineWidth = lw;
				ctx.lineJoin = 'miter';

				let step = pp[1];

				ctx.moveTo(
					step.x * g.tw + twHalf,
					step.y * g.tw + twHalf
				);

				for( let i = 2; i < pp.length - 1; i++ ) {
					step = pp[i];

					ctx.lineTo(
						step.x * g.tw + twHalf,
						step.y * g.tw + twHalf
					);
				}

				ctx.stroke();
			}
		}

	} );

	loop.start();


} )();
