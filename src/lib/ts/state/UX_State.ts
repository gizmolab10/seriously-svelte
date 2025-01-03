import { Segment_Map, Element_State, Rotation_State } from '../common/Global_Imports';
import { Mouse_State, Mouse_Timer, ElementType } from '../common/Global_Imports';
import Identifiable from '../basis/Identifiable';

export default class UX_State {

	rotation_state_byName: {[name: string]: Rotation_State} = {};
	element_state_byName: {[name: string]: Element_State} = {};
	mouse_state_byName: { [name: string]: Mouse_State } = {};
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	segment_map_byName: {[name: string]: Segment_Map} = {};

	//////////////////////////////////////
	//									//
	//	preservation of state outside	//
	//	  transient svelte components	//
	//									//
	//  this allows them to be deleted	//
	//	  by their own event handling	//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Radial & Paging_Arc			//
	//									//
	//////////////////////////////////////

	reset_paging() { this.rotation_states.map(s => s.reset()); }
	segment_map_forName(name: string): Segment_Map { return this.segment_map_byName[name]; }
	element_state_forName(name: string): Element_State { return this.element_state_byName[name]; }
	get rotation_states(): Array<Rotation_State> { return Object.values(this.rotation_state_byName); }
	set_segment_map_forName(map: Segment_Map, name: string) { return this.segment_map_byName[name] = map; }
	get isAny_paging_arc_active(): boolean { return this.rotation_states.filter(s => s.isActive).length > 0; }
	get isAny_paging_arc_hovering(): boolean { return this.rotation_states.filter(s => s.isHovering).length > 0; }

	name_from(identifiable: Identifiable, type: ElementType, subtype: string): string {
		return `${type}-${subtype}-id:${identifiable.id}`;
	}

	rotation_state_forName(name: string): Rotation_State {
		let rotation_state = this.rotation_state_byName[name];
		if (!rotation_state) {
			rotation_state = new Rotation_State();
			this.rotation_state_byName[name] = rotation_state;
		}
		return rotation_state;
	}

	mouse_state_forName(name: string): Mouse_State {
		let state = this.mouse_state_byName[name];
		if (!state) {
			state = Mouse_State.empty();
			this.mouse_state_byName[name] = state;
		}
		return state;
	}

	mouse_timer_forName(name: string): Mouse_Timer {
		let state = this.mouse_timer_byName[name];
		if (!state) {
			state = new Mouse_Timer();
			this.mouse_timer_byName[name] = state;
		}
		return state;
	}

	element_state_for(identifiable: Identifiable | null, type: ElementType, subtype: string): Element_State {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		let element_state = this.element_state_forName(name);
		if (!element_state) {
			element_state = new Element_State(realIdentifiable, type, subtype);
			this.element_state_byName[name] = element_state;
		}
		return element_state;
	}

}

export const ux = new UX_State();
