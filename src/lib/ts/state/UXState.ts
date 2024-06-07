import { k, RingState, ButtonState } from '../common/GlobalImports';

type MouseState = {clicks: number, hit: boolean};
type RingState_byName = {[name: string]: RingState};
type MouseState_byName = {[name: string]: MouseState};		// defined above


class State {

	//////////////////////////////
	//							//
	//	preservation of state	//
	//	external to transient	//
	//	svelte components		//
	//							//
	//  this allows them to be	//
	//	deleted by their own	//
	//	event handling			//
	//							//
	//	all the buttons use it	//
	//							//
	//////////////////////////////

	rebuild_count = 0;
	ringState_byName: RingState_byName = {};
	mouseState_byName: MouseState_byName = {};
	buttonState_byName: {[name: string]: ButtonState} = {};

	ringState_forName(name: string): RingState {
		let state = this.ringState_byName[name];
		if (!state) {
			state = new RingState(name);
			this.ringState_byName[name] = state;
		}
		return state;
	}

	mouseState_forName(name: string): MouseState {
		let state = this.mouseState_byName[name];
		if (!state) {
			state = {clicks: 0, hit: false};
			this.mouseState_byName[name] = state;
		}
		return state;
	}

	buttonState_forName(name: string): ButtonState {
		let appearance = this.buttonState_byName[name];
		if (!appearance) {
			appearance = new ButtonState(k.color_defaultText, 'transparent', k.cursor_default);
			this.buttonState_byName[name] = appearance;
		}
		return appearance;
	}

}

export let s = new State();
