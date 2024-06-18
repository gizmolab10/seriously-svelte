import { MouseState, ElementType, ElementState } from '../common/GlobalImports';
import Identifiable from '../data/Identifiable';
import RingState from '../state/RingState';

class State {

	elementState_byName: {[name: string]: ElementState} = {};
	mouseState_byName: { [name: string]: MouseState } = {};
	ringStates: Array<RingState> = [];
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
	//	used by: Button, NecklaceRing &	//
	//		CloseButton					//
	//									//
	//////////////////////////////////////

	elementState_forName(name: string): ElementState { return this.elementState_byName[name]; }

	elementState_for(identifiable: Identifiable | null, type: ElementType, subtype: string): ElementState {
		const realIdentifiable = identifiable ?? new Identifiable(Identifiable.newID())
		const name = ElementState.elementName_from(realIdentifiable, type, subtype);
		let elementState = this.elementState_forName(name);
		if (!elementState) {
			elementState = new ElementState(realIdentifiable, type, subtype);
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

export const s = new State();
