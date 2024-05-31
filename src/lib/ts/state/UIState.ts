import { k, RingState, ButtonAppearance } from '../common/GlobalImports';

type MouseState = {clicks: number, hit: boolean};
type RingState_byName = {[name: string]: RingState};
type MouseState_byName = {[name: string]: MouseState};


class State {

	//////////////////////////////////////
	//									//
	//	repository of state for			//
	//	transient svelte components		//
	//	that need to store state		//
	//	somewhere outside themselves	//
	//									//
	//	MouseButton, its containers,	//
	//	  like EditingTools & Controls	//
	//									//
	//////////////////////////////////////

	rebuild_count = 0;
	ringState_byName: RingState_byName = {};
	mouseState_byName: MouseState_byName = {};
	appearance_byName: {[name: string]: ButtonAppearance} = {};

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

	appearance_forName(name: string): ButtonAppearance {
		let appearance = this.appearance_byName[name];
		if (!appearance) {
			appearance = new ButtonAppearance(k.color_defaultText, 'transparent', k.cursor_default);
			this.appearance_byName[name] = appearance;
		}
		return appearance;
	}

}

export let s = new State();
