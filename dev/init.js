'use strict';
/* jshint -W018 */


( () => {


	/**
	 * Get a certain canvas element and its 2D context.
	 * @return {Array} Canvas and 2D context.
	 */
	function getCanvasAndCtx() {
		let canvas = document.createElement( 'canvas' );
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
		let x = 2 + ~~( g.rnd() * ( g.mc - 4 ) );
		let y = 2 + ~~( g.rnd() * ( g.mr - 4 ) );
		let dtX = Math.abs( player.x - x );
		let dtY = Math.abs( player.y - y );

		// Minimum distance from player at spawn time.
		if( dtX < 10 && dtY < 10 ) {
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
		started: false,
		rnd: Math.random,
		tw: 48, // default tile width (and height) [px]
		ww: window.innerWidth, // window width
		wh: window.innerHeight // window height
	};

	// Random map size.
	g.mc = 128 + ~~( g.rnd() * 128 ); // number of map columns
	g.mr = 128 + ~~( g.rnd() * 128 ); // number of map rows

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
		// Water border.
		else if( !x || !y || x == g.mc - 1 || y == g.mr - 1 ) {
			let blue = 140 + g.rnd() * 60;
			c = `rgb(30,90,${~~blue})`;
			map[i] = 16;
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

			let f = ( de < 2 ) ? 0 : Math.min( 1.15 - Math.min( 3 / de, 1 ), 1 );
			fogCtx.fillStyle = `rgba(0,0,0,${f})`;
			fogCtx.fillRect( x, y, 1, 1 );
		}
	}


	// Place the goal.
	// Make sure it has some minimum
	// margin to the map borders.

	let goal = {
		x: 4 + ~~( g.rnd() * ( g.mc - 8 ) ),
		y: 4 + ~~( g.rnd() * ( g.mr - 8 ) )
	};

	// Reduce risk of being walled in by
	// turning the fields around into grass.
	map[( goal.y - 1 ) * g.mc + goal.x] = 2;
	map[( goal.y + 1 ) * g.mc + goal.x] = 2;
	map[goal.y * g.mc + goal.x - 1] = 2;
	map[goal.y * g.mc + goal.x + 1] = 2;

	map[goal.y * g.mc + goal.x] = 8;
	PF.generateMap( goal.x, goal.y );


	// Initialize the main canvas.
	k.init();
	k.canvas.width = g.ww;
	k.canvas.height = g.wh;
	k.context.imageSmoothingEnabled = false;

	let [pStartX, pStartY] = getPlayerStartPos();
	let player = new Char( pStartX, pStartY );

	k.keys.bind( 'left', () => player.mv( -1, 0, Date.now() ) );
	k.keys.bind( 'right', () => player.mv( 1, 0, Date.now() ) );
	k.keys.bind( 'up', () => player.mv( 0, -1, Date.now() ) );
	k.keys.bind( 'down', () => player.mv( 0, 1, Date.now() ) );

	// Toggle online mode -> toggle navigation and monster behaviour
	k.keys.bind( 'o', () => {
		if( g.started ) {
			g.isOnline = !g.isOnline;
		}
	} );

	// Source and destination areas for fog images.
	let sourceCut = [1, 1, g.mc - 1, g.mr - 1];
	let dest = [0, 0, g.mw, g.mh];
	let destCut = [g.tw, g.tw, g.mw - g.tw, g.mh - g.tw];

	let wwHalf = g.ww / 2;
	let whHalf = g.wh / 2;
	let centerLimitW = g.ww - g.mw;
	let centerLimitH = g.wh - g.mh;
	let twHalf = ~~( g.tw / 2 );
	let lineWidth = ~~( g.tw / 4 );
	let ctx = k.context;
	let pathColor = '#6BBEE1';

	// Place monsters. ~0.2% of map should be monsters.
	let numMonsters = map.length * 0.002;
	let monsters = [];

	for( let i = 0; i < numMonsters; i++ ) {
		let pos = getMonsterStartPos( player );

		if( pos ) {
			monsters.push( new Char( ...pos, '#C20215', true ) );
		}
	}

	numMonsters = monsters.length;

	let playerImg = document.getElementById( 'p' );
	let monsterImg = document.getElementById( 'm' );

	player.path = PF.findGoal( player.x, player.y );

	let loop = k.gameLoop( {

		update: ( dt ) => {
			if( player.x == goal.x && player.y == goal.y && !g.isAtGoal ) {
				g.isAtGoal = true;
				loop.stop();
				document.getElementById( 'w' ).style.display = 'flex';

				return;
			}

			for( let i = 0; i < numMonsters; i++ ) {
				monsters[i].updateMonster( dt, player );
			}
		},

		render: () => {
			// Center on player, but stop at borders.
			let cx = wwHalf - player.x * g.tw;
			cx = ( cx > 0 ) ? 0 : cx;
			cx = ( cx < centerLimitW ) ? centerLimitW : ~~cx;

			let cy = whHalf - player.y * g.tw;
			cy = ( cy > 0 ) ? 0 : cy;
			cy = ( cy < centerLimitH ) ? centerLimitH : ~~cy;

			ctx.setTransform( 1, 0, 0, 1, cx, cy );


			// Draw the ground image but upscale it.
			// The tiles in the original are only 1x1 px.
			ctx.drawImage( groundCanvas, ...dest );


			// Monsters.
			for( let i = 0; i < numMonsters; i++ ) {
				let m = monsters[i];
				ctx.drawImage(
					monsterImg, ...m.getImgCut(),
					m.x * g.tw, m.y * g.tw,
					g.tw, g.tw
				);
			}


			// Player.
			let x = cx + player.x * g.tw;
			let y = cy + player.y * g.tw;
			ctx.setTransform( 1, 0, 0, 1, x, y );
			ctx.drawImage( playerImg, ...player.getImgCut(), 0, 0, g.tw, g.tw );


			// Draw the fog.
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
			let pp = player.path;
			let ppLen = pp && pp.length;

			if( pp && ppLen > 2 && g.isOnline ) {
				ctx.setTransform( 1, 0, 0, 1, cx + twHalf, cy + twHalf );

				ctx.beginPath();
				ctx.strokeStyle = pathColor;
				ctx.lineWidth = lineWidth;
				ctx.lineJoin = 'miter';

				let step = pp[1];

				ctx.moveTo(
					step.x * g.tw,
					step.y * g.tw
				);

				for( let i = 2; i < ppLen; i++ ) {
					step = pp[i];

					ctx.lineTo(
						step.x * g.tw,
						step.y * g.tw
					);
				}

				ctx.stroke();
				ctx.closePath();

				// Little marker on the final tile.
				step = pp[ppLen - 1];
				ctx.fillStyle = pathColor;
				ctx.fillRect( step.x * g.tw - lineWidth, step.y * g.tw - lineWidth, lineWidth * 2, lineWidth * 2 );
			}
		}

	} );

	// Render once for background.
	loop.render();

	k.keys.bind( 's', () => {
		if( g.started ) {
			return;
		}

		g.started = true;
		document.getElementById( 't' ).style.display = 'none';
		loop.start();
	} );


} )();
