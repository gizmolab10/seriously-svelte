import { k, IDTool, MouseState, ElementType, ElementState } from '../common/GlobalImports';
import Identifiable from '../data/Identifiable';
import RingState from '../state/RingState';

class State {

	elementState_byName: {[name: string]: ElementState} = {};
	mouseState_byName: { [name: string]: MouseState } = {};
	ringState = new RingState();
	rebuild_count = 0;

	//////////////////////////////////////
	//									//
	//	preservation of state outside	//
	//		transient svelte components	//
	//									//
	//  this allows them to be deleted	//
	//		by their own event handling	//
	//									//
	//	used by: Button, RingButton &	//
	//		CloseButton					//
	//									//
	//////////////////////////////////////

	elementState_forName(name: string): ElementState { return this.elementState_byName[name]; }

	elementName_from(identifiable: Identifiable, type: ElementType, tool: IDTool): string {
		return `${type}-${tool}-${identifiable.id}`;
	}

	elementState_for(identifiable: Identifiable, type: ElementType, tool: IDTool): ElementState {
		const name = this.elementName_from(identifiable, type, tool);
		let elementState = this.elementState_forName(name);
		if (!elementState) {
			elementState = new ElementState(identifiable, type, tool);
			this.elementState_byName[name] = elementState;
		}
		return elementState;
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
