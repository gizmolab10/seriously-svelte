import { S_Mouse, S_Widget, S_Element, S_Expansion, S_Rotation, S_Thing_Pages } from '../common/Global_Imports';
import { G_Segment, G_TreeGraph, T_Graph, T_Element } from '../common/Global_Imports';
import { Ancestry, Mouse_Timer } from '../common/Global_Imports';
import Identifiable from '../data/runtime/Identifiable';
import type { Dictionary } from '../common/Types';
import { w_t_graph } from '../common/Stores';
import { get } from 'svelte/store';

export default class User_Interaction {
	s_thing_pages_byThingID: {[id: string]: S_Thing_Pages} = {};
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	s_widget_byAncestryID: { [id: string]: S_Widget } = {};
	s_rotation_byName: { [name: string]: S_Rotation } = {};
	rebuild_needed_byType: {[type: string]: boolean} = {};
	g_segment_byName: { [name: string]: G_Segment } = {};
	s_element_byName: { [name: string]: S_Element } = {};
	s_mouse_byName: { [name: string]: S_Mouse } = {};
	s_cluster_rotation = new S_Rotation();
	s_ring_resizing	= new S_Expansion();
	s_ring_rotation	= new S_Rotation();
	g_treeGraph = new G_TreeGraph();
	mouse_responder_number = 0;
	isEditing_text = false;

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
	
	get inTreeMode(): boolean { return get(w_t_graph) == T_Graph.tree; }
	get s_paging_rotations(): Array<S_Rotation> { return Object.values(this.s_rotation_byName); }
	get isAny_paging_arc_active(): boolean { return this.s_paging_rotations.filter(s => s.isActive).length > 0; }
	get isAny_paging_arc_hovering(): boolean { return this.s_paging_rotations.filter(s => s.isHovering).length > 0; }
	get isAny_rotation_active(): boolean { return this.isAny_paging_arc_active || this.s_cluster_rotation.isActive || this.s_ring_rotation.isActive; }

	reset_paging() { this.s_paging_rotations.map(s => s.reset()); }
	s_widget_forID(id: string): S_Widget { return this.s_widget_byAncestryID[id]; }
	s_element_forName(name: string): S_Element { return this.s_element_byName[name]; }
	g_segment_forName(name: string): G_Segment { return this.g_segment_byName[name]; }
	require_rebuild_forType(type: string) { this.rebuild_needed_byType[type] = true; }
	set_g_segment_forName(g_segment: G_Segment, name: string) { return this.g_segment_byName[name] = g_segment; }
	s_mouse_forName(name: string): S_Mouse { return this.assure_forKey_inDict(name, this.s_mouse_byName, () => S_Mouse.empty()); }
	name_from(identifiable: Identifiable, type: T_Element, subtype: string): string { return `${type}(${subtype}) (id '${identifiable.id}')`; }
	mouse_timer_forName(name: string): Mouse_Timer { return this.assure_forKey_inDict(name, this.mouse_timer_byName, () => new Mouse_Timer()); }
	s_paging_rotation_forName(name: string): S_Rotation { return this.assure_forKey_inDict(name, this.s_rotation_byName, () => new S_Rotation()); }
	s_widget_forAncestry(ancestry: Ancestry): S_Widget { return this.assure_forKey_inDict(ancestry.id, this.s_widget_byAncestryID, () => new S_Widget(ancestry)); }
	
	s_thing_pages_forThingID(id: string | null | undefined): S_Thing_Pages | null {
		return !id ? null : this.assure_forKey_inDict(id, this.s_thing_pages_byThingID, () => new S_Thing_Pages(id));
	}

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	s_element_for(identifiable: Identifiable | null, type: T_Element, subtype: string): S_Element {
		const realIdentifiable = identifiable ?? new Identifiable()
		const name = this.name_from(realIdentifiable, type, subtype);
		return this.assure_forKey_inDict(name, this.s_element_byName, () => new S_Element(realIdentifiable, type, subtype));
	}

	readOnce_rebuild_needed_forType(type: string) : boolean {
		const needed = this.rebuild_needed_byType[type];
		this.rebuild_needed_byType[type] = false;
		return needed;
	}

	assure_forKey_inDict<T>(key: string, dict: Dictionary, closure: () => T): T {
		let result = dict[key];
		if (!result) {
			result = closure();
			if (!!result) {
				dict[key] = result;
			}
		}
		return result;
	}

	createAll_thing_pages_fromDict(dict: Dictionary | null) {
		if (!!dict) {
			for (const sub_dict of Object.values(dict)) {
				const s_thing_pages = S_Thing_Pages.create_fromDict(sub_dict);
				if (!!s_thing_pages) {
					this.s_thing_pages_byThingID[s_thing_pages.thing_id] = s_thing_pages;
				}
			}
		}
	}

}

export const ux = new User_Interaction();
