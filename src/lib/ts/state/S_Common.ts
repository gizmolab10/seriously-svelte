import { u, G_Segment, E_Element, Mouse_Timer, Ancestry } from '../common/Global_Imports';
import { S_Mouse, S_Widget, S_Element } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';

export default class S_Common {
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	s_widget_byAncestryID: { [id: string]: S_Widget } = {};
	g_segment_byName: { [name: string]: G_Segment } = {};
	s_element_byName: { [name: string]: S_Element } = {};
	s_mouse_byName: { [name: string]: S_Mouse } = {};
	mouse_responder_number = 0;

	//////////////////////////////////////
	//									//
	//	state managed outside svelte	//
	//									//
	//  allows svelte components to be	//
	//	  deleted by their own event	//
	//	  handling						//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Radial & Radial_ArcSlider		//
	//									//
	//////////////////////////////////////

	s_widget_forID(id: string): S_Widget { return this.s_widget_byAncestryID[id]; }
	s_element_forName(name: string): S_Element { return this.s_element_byName[name]; }
	g_segment_forName(name: string): G_Segment { return this.g_segment_byName[name]; }
	set_g_segment_forName(g_segment: G_Segment, name: string) { return this.g_segment_byName[name] = g_segment; }
	s_mouse_forName(name: string): S_Mouse { return u.assure_forKey_inDict(name, this.s_mouse_byName, () => S_Mouse.empty()); }
	mouse_timer_forName(name: string): Mouse_Timer { return u.assure_forKey_inDict(name, this.mouse_timer_byName, () => new Mouse_Timer()); }
	name_from(identifiable: Identifiable, type: E_Element, subtype: string): string { return `${type}(${subtype}) (id '${identifiable.id}')`; }
	s_widget_forAncestry(ancestry: Ancestry): S_Widget { return u.assure_forKey_inDict(ancestry.pathString, this.s_widget_byAncestryID, () => new S_Widget(ancestry)); }

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	s_element_for(identifiable: Identifiable | null, type: E_Element, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		return u.assure_forKey_inDict(name, this.s_element_byName, () => new S_Element(realIdentifiable, type, subtype));
	}

}

export const ux = new S_Common();
