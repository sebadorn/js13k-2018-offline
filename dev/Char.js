'use strict';


class Char {


	/**
	 * A character which can move around.
	 * @constructor
	 * @param {number}   x                  - X index on map.
	 * @param {number}   y                  - Y index on map.
	 * @param {boolean} [isMonster = false]
	 */
	constructor( x, y, isMonster = false ) {
		this._last = 0; // Last update.

		this.x = x;
		this.y = y;

		this.x_old = x;
		this.y_old = y;

		this.x_px = this.x * g.tw;
		this.y_px = this.y * g.tw;

		this.path = null;
		this.monster = isMonster;

		this._invincible = 0;
		this._progress = 0;
		this._progressBlood = 1;
		this._speed = isMonster ? 0.3 : 0.12;

		// Direction of movement.
		// 1: up
		// 2: right
		// 3: down
		// 4: left
		this.dir = 3;
	}


	/**
	 * Get the cut offset for the source image.
	 * @return {number[]}
	 */
	getImgCut() {
		let t = [0, 0, 16, 16];

		if( this.dir == 1 ) {
			t[0] = 16;
		}
		else if( this.dir == 2 ) {
			t[1] = 16;
		}
		else if( this.dir == 4 ) {
			t[0] = 16;
			t[1] = 16;
		}

		if( !this.monster && g.isOnline ) {
			t[0] += 32;
		}

		return t;
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
		if( ts && ts - this._lastMV < this._speed * 1000 ) {
			return;
		}

		this._lastMV = ts;
		this._progress = 0;

		this.x_old = this.x;
		this.y_old = this.y;

		this.x += x;
		this.y += y;

		let t = g.map[this.y * g.mc + this.x];

		// Not passable terrain or outside bounds.
		if(
			t & 4 ||
			this.x < 1 ||
			this.y < 1 ||
			this.x >= g.mc - 1 ||
			this.y >= g.mr - 1
		) {
			this.x -= x;
			this.y -= y;
		}
		else if( !this.monster ) {
			this.path = PF.findGoal( this.x, this.y );
		}

		if( y ) {
			this.dir = ( y < 0 ) ? 1 : 3;
		}
		else {
			this.dir = ( x < 0 ) ? 4 : 2;
		}
	}


	/**
	 * Take damage.
	 */
	takeDamage() {
		if( this._invincible ) {
			return;
		}

		// For 2 seconds no more damage can be taken.
		this._invincible = 2;

		this._progressBlood = 0;
	}


	/**
	 * Draw a blood effect.
	 * @param {CanvasRenderingContext2D} ctx
	 */
	drawBlood( ctx ) {
		if( this._progressBlood == 1 ) {
			return;
		}

		// let tw8 = g.tw / 8;
		// let f = this._progressBlood * Math.PI - Math.PI / 2;
		// let x = -Math.sin( f ) * tw8 - tw8;
		// let y = -Math.cos( f ) * tw8;

		ctx.fillStyle = 'red';
		ctx.fillRect( 0, 0, g.tw / 8, g.tw / 8 );
		// ctx.fillRect( x, y, tw8, tw8 );
		// ctx.fillRect(
		// 	x + tw8 * 2,
		// 	y + tw8,
		// 	tw8 / 2,
		// 	tw8 / 2
		// );
		// ctx.fillRect(
		// 	x + tw8 * 1.5,
		// 	y + tw8 * 0.5,
		// 	tw8 / 1.5,
		// 	tw8 / 1.5
		// );
	}


	/**
	 * Update position progress.
	 * @param {number} dt
	 */
	update( dt ) {
		this._invincible = Math.max( this._invincible - dt, 0 );

		this._progress += dt / this._speed;
		this._progressBlood = Math.min( this._progressBlood + dt, 1 );

		if( this._progress > 1 ) {
			this._progress = 1;
		}

		let p = this._progress;

		this.x_px = ( p * this.x + ( 1 - p ) * this.x_old ) * g.tw;
		this.y_px = ( p * this.y + ( 1 - p ) * this.y_old ) * g.tw;
	}


	/**
	 * Update the monster position.
	 * @param {number} dt     - Time difference in [ms] since last update.
	 * @param {Char}   player
	 */
	updateMonster( dt, player ) {
		this.update( dt );

		this._last += dt;

		let dtX = this.x - player.x;
		let dtY = this.y - player.y;
		let playerDistance = Math.sqrt( dtX * dtX + dtY * dtY );

		let targetPlayer = g.isOnline || playerDistance < 6;

		// They are fast once they hunt, but
		// have to be slower than the player.
		let rhythm = targetPlayer ? this._speed : 1;

		// Movement rhythm.
		if( !playerDistance || this._last < rhythm ) {
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
		if( goRandom ) {
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
