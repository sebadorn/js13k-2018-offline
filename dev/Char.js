'use strict';


class Char {


	/**
	 * A character which can move around.
	 * @constructor
	 * @param {number} x     - X index on map.
	 * @param {number} y     - Y index on map.
	 * @param {string} color
	 */
	constructor( x, y, color = '#FFF', isMonster = false ) {
		this._last = 0; // Last update.

		this.x = x;
		this.y = y;
		this.path = null;
		this.monster = isMonster;
		this._progress = 0;

		this.s = k.sprite( {
			x: x * g.tw,
			y: y * g.tw,
			color: color,
			width: g.tw,
			height: g.tw
		} );
	}


	/**
	 * Move the character.
	 * @param {number}  x  - X index change on map.
	 * @param {number}  y  - Y index change on map.
	 * @param ?{number} ts - Timestamp.
	 */
	mv( x, y, ts ) {
		if( !g.started ) {
			return;
		}

		// Slow down movement, because holding down
		// the arrow key repeats the event too fast.
		if( ts && ts - this._lastMV < 150 ) {
			return;
		}

		this._progress = 0;

		this._lastMV = ts;

		this._xOld = this.x;
		this._yOld = this.y;

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
		else if( !this.monster ) {
			this.path = PF.findGoal( this.x, this.y );
		}

		this.s.x = this.x * g.tw;
		this.s.y = this.y * g.tw;
	}


	// update( dt ) {
	// 	this._progress += 0.2;

	// 	if( this._progress > 1 ) {
	// 		this._progress = 1;
	// 	}

	// 	let p = this._progress;

	// 	this.s.x = ( p * this.x + ( 1 - p ) * this._xOld ) * g.tw;
	// 	this.s.y = ( p * this.y + ( 1 - p ) * this._yOld ) * g.tw;
	// }


	/**
	 * Update the monster position.
	 * @param {number} dt     - Time difference in [ms] since last update.
	 * @param {Char}   player
	 */
	updateMonster( dt, player ) {
		this._last += dt;

		let dtX = this.x - player.x;
		let dtY = this.y - player.y;
		let playerDistance = Math.sqrt( dtX * dtX + dtY * dtY );

		let targetPlayer = g.isOnline || playerDistance < 6;

		// They are fast once they hunt, but
		// have to be slower than the player.
		let rhythm = targetPlayer ? 0.3 : 1;

		// Movement rhythm.
		if( this._last < rhythm ) {
			return;
		}

		this._last = 0;

		let x = 0;
		let y = 0;
		let goRandom = true;

		// Target the player either because they
		// are online or because of closeness.
		if( targetPlayer ) {
			if( Math.abs( dtX ) > Math.abs( dtY ) ) {
				x = ( dtX < 0 ) ? 1 : -1;
			}
			else {
				y = ( dtY < 0 ) ? 1 : -1;
			}

			// Cannot go there. Take a random step instead
			// and hope it leaves the blocked path.
			let t = g.map[( this.y + y ) * g.mc + this.x + x];
			goRandom = t & 4;
		}

		// Aimless, random movement.
		if (goRandom) {
			if( g.rnd() < 0.5 ) {
				x = Math.round( -1 + g.rnd() * 2 );
				y = 0;
			}
			else {
				x = 0;
				y = Math.round( -1 + g.rnd() * 2 );
			}
		}

		this.mv( x, y );
	}


}
