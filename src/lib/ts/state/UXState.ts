import { k, RingState, ElementType, ElementState } from '../common/GlobalImports';
import Identifiable from "../data/Identifiable";

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
	elementState_byName: {[name: string]: ElementState} = {};

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

	elementState_forName(name: string): ElementState {
		let elementState = this.elementState_byName[name];
		if (!elementState) {
			elementState = new ElementState(k.color_defaultText, 'transparent', k.cursor_default);
			this.elementState_byName[name] = elementState;
		}
		return elementState;
	}

	elementState_forAncestry(name: string, identifiable: Identifiable): ElementState {
		let elementState = this.elementState_forName(name);
		elementState.identifiable = identifiable;
		return elementState;
	}

	elementState_forType(name: string, identifiable: Identifiable, type: ElementType): ElementState {
		let elementState = this.elementState_forAncestry(name, identifiable);
		elementState.type = type;
		return elementState;
	}

}

export let s = new State();
