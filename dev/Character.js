'use strict';


class Char {


	/**
	 * A character which can move around.
	 * @constructor
	 * @param {number} x     - X index on map.
	 * @param {number} y     - Y index on map.
	 * @param {string} color
	 */
	constructor( x, y, color = '#FFF' ) {
		this._last = 0; // Last update.

		this.x = x;
		this.y = y;
		this.path = null;

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
			this.path = PF.findGoal( this.x, this.y );
		}

		this.s.x = this.x * g.tw;
		this.s.y = this.y * g.tw;
	}


	/**
	 * Update the monster position.
	 * @param {number} dt     - Time in [ms] since last update.
	 * @param {Char}   player
	 */
	updateMonster( dt, player ) {
		this._last += dt;

		// Only update every second.
		if( this._last < 1 ) {
			return;
		}

		this._last = 0;

		let x = 0;
		let y = 0;

		if( g.rnd() < 0.5 ) {
			x += Math.round( -1 + g.rnd() * 2 );
		}
		else {
			y += Math.round( -1 + g.rnd() * 2 );
		}

		this.mv( x, y );
	}


}
