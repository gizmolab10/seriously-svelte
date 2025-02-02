import { S_Mouse, G_Segment, S_Element, S_Rotation, S_Thing_Pages } from '../common/Global_Imports';
import { T_Element, Mouse_Timer } from '../common/Global_Imports';
import Identifiable from '../data/basis/Identifiable';
import type { Dictionary } from '../common/Types';

export default class S_UX {

	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	s_thing_pages_byThingID: {[id: string]: S_Thing_Pages} = {};
	s_rotation_byName: {[name: string]: S_Rotation} = {};
	g_segment_byName: {[name: string]: G_Segment} = {};
	s_element_byName: {[name: string]: S_Element} = {};
	s_mouse_byName: { [name: string]: S_Mouse } = {};

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
	get rotation_states(): Array<S_Rotation> { return Object.values(this.s_rotation_byName); }
	get isAny_paging_arc_active(): boolean { return this.rotation_states.filter(s => s.isActive).length > 0; }
	set_g_segment_forName(g_segment: G_Segment, name: string) { return this.g_segment_byName[name] = g_segment; }
	get isAny_paging_arc_hovering(): boolean { return this.rotation_states.filter(s => s.isHovering).length > 0; }

	name_from(identifiable: Identifiable, type: T_Element, subtype: string): string {
		return `${type}-${subtype}-id:${identifiable.id}`;
	}

	s_mouse_forName(name: string): S_Mouse {
		let state = this.s_mouse_byName[name];
		if (!state) {		// always assure it exists
			state = S_Mouse.empty();
			this.s_mouse_byName[name] = state;
		}
		return state;
	}

	mouse_timer_forName(name: string): Mouse_Timer {
		let timer = this.mouse_timer_byName[name];
		if (!timer) {		// always assure it exists
			timer = new Mouse_Timer();
			this.mouse_timer_byName[name] = timer;
		}
		return timer;
	}

	s_rotation_forName(name: string): S_Rotation {
		let s_rotation = this.s_rotation_byName[name];
		if (!s_rotation) {		// always assure it exists
			s_rotation = new S_Rotation();
			this.s_rotation_byName[name] = s_rotation;
		}
		return s_rotation;
	}

	s_element_for(identifiable: Identifiable | null, type: T_Element, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		let s_element = this.s_element_forName(name);
		if (!s_element) {			// always assure it exists
			s_element = new S_Element(realIdentifiable, type, subtype);
			this.s_element_byName[name] = s_element;
		}
		return s_element;
	}

	s_thing_pages_forThingID(id: string | null | undefined): S_Thing_Pages | null {
		if (!id) {
			return null;
		}
		let s_thing_pages = this.s_thing_pages_byThingID[id];
		if (!s_thing_pages) {		// always assure it exists
			s_thing_pages = new S_Thing_Pages(id);
			this.s_thing_pages_byThingID[id] = s_thing_pages;
		}
		return s_thing_pages;
	}

	createAll_thing_pages_fromDict(dict: Dictionary) {
		for (const sub_dict of Object.values(dict)) {
			const s_thing_pages = S_Thing_Pages.create_fromDict(sub_dict);
			if (!!s_thing_pages) {
				this.s_thing_pages_byThingID[s_thing_pages.thing_id] = s_thing_pages;
			}
		}
	}

}

export const ux = new S_UX();
