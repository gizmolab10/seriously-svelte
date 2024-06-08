import { k, IDTool, RingState, MouseState, ElementType, ElementState } from '../common/GlobalImports';
import Identifiable from "../data/Identifiable";

export type MouseState_byName = { [name: string]: MouseState };
export type RingState_byName = { [name: string]: RingState };

class State {

	elementState_byName: {[name: string]: ElementState} = {};
	mouseState_byName: MouseState_byName = {};
	ringState_byName: RingState_byName = {};
	rebuild_count = 0;

	//////////////////////////////////////
	//									//
	//	to transient svelte components	//
	//	preservation of state external	//
	//									//
	//  this allows them to be deleted	//
	//	by their own event handling		//
	//									//
	//	all the buttons use it			//
	//									//
	//////////////////////////////////////

	elementState_forName(name: string): ElementState { return this.elementState_byName[name]; }

	nameFrom(identifiable: Identifiable, type: ElementType, tool: IDTool): string {
		return `${type}-${tool}-${identifiable.id}`;
	}

	elementState_for(identifiable: Identifiable, type: ElementType, tool: IDTool): ElementState {
		const name = this.nameFrom(identifiable, type, tool);
		let elementState = this.elementState_forName(name);
		if (!elementState) {
			elementState = new ElementState(identifiable, type, tool);
			this.elementState_byName[name] = elementState;
		}
		return elementState;
	}

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
			state = MouseState.empty();
			this.mouseState_byName[name] = state;
		}
		return state;
	}

}

export let s = new State();
