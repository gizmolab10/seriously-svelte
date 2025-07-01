import { S_Mouse, S_Widget, S_Element, T_Graph } from '../common/Global_Imports';
import { u, T_Element, Mouse_Timer, Ancestry } from '../common/Global_Imports';
import { w_show_graph_ofType } from '../common/Stores';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

export default class S_Common {
	s_widget_byAncestryID: { [id: string]: S_Widget } = {};
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

	get inTreeMode(): boolean { return get(w_show_graph_ofType) == T_Graph.tree; }
	s_widget_forID(id: string): S_Widget { return this.s_widget_byAncestryID[id]; }
	get inRadialMode(): boolean { return get(w_show_graph_ofType) == T_Graph.radial; }
	s_element_forName(name: string): S_Element { return this.s_element_byName[name]; }
	s_mouse_forName(name: string): S_Mouse { return u.assure_forKey_inDict(name, this.s_mouse_byName, () => S_Mouse.empty()); }
	name_from(identifiable: Identifiable, type: T_Element, subtype: string): string { return `${type}(${subtype}) (id '${identifiable.id}')`; }
	s_widget_forAncestry(ancestry: Ancestry): S_Widget { return u.assure_forKey_inDict(ancestry.pathString, this.s_widget_byAncestryID, () => new S_Widget(ancestry)); }

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	s_element_for(identifiable: Identifiable | null, type: T_Element, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		return u.assure_forKey_inDict(name, this.s_element_byName, () => new S_Element(realIdentifiable, type, subtype));
	}

}

export const ux = new S_Common();
