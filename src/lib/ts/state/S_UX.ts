import { S_Mouse, G_Segment, S_Element, S_Rotation } from '../common/Global_Imports';
import { T_Element, Mouse_Timer } from '../common/Global_Imports';
import Identifiable from '../data/basis/Identifiable';

export default class S_UX {

	rotation_state_byName: {[name: string]: S_Rotation} = {};
	s_element_byName: {[name: string]: S_Element} = {};
	mouse_state_byName: { [name: string]: S_Mouse } = {};
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	g_segment_byName: {[name: string]: G_Segment} = {};

	//////////////////////////////////////
	//									//
	//	preservation of state outside	//
	//	  transient svelte components	//
	//									//
	//  this allows them to be deleted	//
	//	  by their own event handling	//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Radial & Paging_ArcSlider		//
	//									//
	//////////////////////////////////////

	reset_paging() { this.rotation_states.map(s => s.reset()); }
	g_segment_forName(name: string): G_Segment { return this.g_segment_byName[name]; }
	s_element_forName(name: string): S_Element { return this.s_element_byName[name]; }
	get rotation_states(): Array<S_Rotation> { return Object.values(this.rotation_state_byName); }
	get isAny_paging_arc_active(): boolean { return this.rotation_states.filter(s => s.isActive).length > 0; }
	set_g_segment_forName(g_segment: G_Segment, name: string) { return this.g_segment_byName[name] = g_segment; }
	get isAny_paging_arc_hovering(): boolean { return this.rotation_states.filter(s => s.isHovering).length > 0; }

	name_from(identifiable: Identifiable, type: T_Element, subtype: string): string {
		return `${type}-${subtype}-id:${identifiable.id}`;
	}

	rotation_state_forName(name: string): S_Rotation {
		let rotation_state = this.rotation_state_byName[name];
		if (!rotation_state) {
			rotation_state = new S_Rotation();
			this.rotation_state_byName[name] = rotation_state;
		}
		return rotation_state;
	}

	mouse_state_forName(name: string): S_Mouse {
		let state = this.mouse_state_byName[name];
		if (!state) {
			state = S_Mouse.empty();
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

	s_element_for(identifiable: Identifiable | null, type: T_Element, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		let s_element = this.s_element_forName(name);
		if (!s_element) {
			s_element = new S_Element(realIdentifiable, type, subtype);
			this.s_element_byName[name] = s_element;
		}
		return s_element;
	}

}

export const ux = new S_UX();
