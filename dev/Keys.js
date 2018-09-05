'use strict';


var Keys = {


	_handler: {},
	state: {},


	/**
	 * Initialize. Setup event listeners.
	 */
	init() {
		document.body.onkeydown = ( ev ) => {
			this.state[ev.which] = 1;
			this._handler[ev.which] && this._handler[ev.which]();
		};

		document.body.onkeyup = ( ev ) => {
			this.state[ev.which] = 0;
		};
	},


	/**
	 * Check if a key is currently being pressed.
	 * @param  {number} code - Key code.
	 * @return {boolean}
	 */
	isPressed( code ) {
		return !!this.state[code];
	},


	/**
	 * Add a listener for the keydown event.
	 * @param {number}   code - Key code.
	 * @param {function} cb   - Callback.
	 */
	on( code, cb ) {
		this._handler[code] = cb;
	}


};
