import { Mouse_State, Element_State, Rotation_State } from '../common/Global_Imports';
import Identifiable from '../data/Identifiable';

export enum ElementType {
	generic	= 'generic',
	advance	= 'advance',
	control	= 'control',
	widget	= 'widget',
	reveal	= 'reveal',
	focus	= 'focus',
	crumb	= 'crumb',
	tool	= 'tool',
	drag	= 'drag',
	none	= 'none',
}

export default class UX_State {

	rotationState_byName: {[name: string]: Rotation_State} = {};
	elementState_byName: {[name: string]: Element_State} = {};
	mouseState_byName: { [name: string]: Mouse_State } = {};
	rebuild_count = 0;

	//////////////////////////////////////
	//									//
	//	preservation of state outside	//
	//		transient svelte components	//
	//									//
	//  this allows them to be deleted	//
	//		by their own event handling	//
	//									//
	//	used by: Button, Necklace_Ring	//
	//		& Close_Button				//
	//									//
	//////////////////////////////////////

	name_from(identifiable: Identifiable, type: ElementType, subtype: string): string {
		return `${type}-${subtype}-${identifiable.id}`;
	}

	elementState_forName(name: string): Element_State { return this.elementState_byName[name]; }

	elementState_for(identifiable: Identifiable | null, type: ElementType, subtype: string): Element_State {
		const realIdentifiable = identifiable ?? new Identifiable(Identifiable.newID())
		const name = this.name_from(realIdentifiable, type, subtype);
		let element_state = this.elementState_forName(name);
		if (!element_state) {
			element_state = new Element_State(realIdentifiable, type, subtype);
			this.elementState_byName[name] = element_state;
		}
		return element_state;
	}

	rotationState_forName(name: string): Rotation_State {
		let rotation_state = this.rotationState_byName[name];
		if (!rotation_state) {
			rotation_state = new Rotation_State();
			this.rotationState_byName[name] = rotation_state;
		}
		return rotation_state;
	}

	mouseState_forName(name: string): Mouse_State {
		let state = this.mouseState_byName[name];
		if (!state) {
			state = Mouse_State.empty();
			this.mouseState_byName[name] = state;
		}
		return state;
	}

}

export const s = new UX_State();
