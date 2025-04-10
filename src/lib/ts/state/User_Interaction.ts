import { S_Mouse, S_Widget, S_Element, S_Expansion, S_Rotation, S_Thing_Pages } from '../common/Global_Imports';
import { k, w, debug, layout, wrappers, Ancestry, G_Segment, Mouse_Timer } from '../common/Global_Imports';
import { T_Banner, T_Element, T_RingZone, T_SvelteComponent } from '../common/Enumerations';
import { w_ring_rotation_radius, w_mouse_location_scaled } from '../common/Stores';
import Identifiable from '../runtime/Identifiable';
import { w_show_details } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class User_Interaction { // Gizmos
	s_paging_rotation_byName: { [name: string]: S_Rotation } = {};
	s_thing_pages_byThingID: {[id: string]: S_Thing_Pages} = {};
	mouse_timer_byName: { [name: string]: Mouse_Timer } = {};
	s_widget_byAncestryID: { [id: string]: S_Widget } = {};
	rebuild_needed_byType: {[type: string]: boolean} = {};
	g_segment_byName: { [name: string]: G_Segment } = {};
	s_element_byName: { [name: string]: S_Element } = {};
	s_mouse_byName: { [name: string]: S_Mouse } = {};
	s_cluster_rotation = new S_Rotation();
	s_ring_resizing	= new S_Expansion();
	s_ring_rotation	= new S_Rotation();
	mouse_responder_number = 0;
	isEditing_text = false;

	//////////////////////////////////////
	//									//
	//	state managed outside svelte	//
	//									//
	//  allows svelte to be deleted		//
	//	  by their own event handling	//
	//									//
	//	used by: Button, Close_Button,	//
	//	  Radial & Radial_ArcSlider		//
	//									//
	//////////////////////////////////////
	
	get s_paging_rotations(): Array<S_Rotation> { return Object.values(this.s_paging_rotation_byName); }
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
	s_paging_rotation_forName(name: string): S_Rotation { return this.assure_forKey_inDict(name, this.s_paging_rotation_byName, () => new S_Rotation()); }
	s_widget_forAncestry(ancestry: Ancestry): S_Widget { return this.assure_forKey_inDict(ancestry.pathString, this.s_widget_byAncestryID, () => new S_Widget(ancestry)); }
	
	s_thing_pages_forThingID(id: string | null | undefined): S_Thing_Pages | null {
		return !id ? null : this.assure_forKey_inDict(id, this.s_thing_pages_byThingID, () => new S_Thing_Pages(id));
	}

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	get ring_zone_atMouseLocation(): T_RingZone {
		let ring_zone = T_RingZone.miss;
		const scaled = get(w_mouse_location_scaled);
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		const widgets = wrappers.wrappers_ofType_atMouseLocation(T_SvelteComponent.widget);
		const outsideDetails = !!scaled && scaled.x > (!get(w_show_details) ? 0 : k.width_details);
		const insideGraphZone = !!scaled && outsideDetails && scaled.y > layout.top_ofBannerAt(T_Banner.crumbs);
		if (!!mouse_vector && widgets.length == 0 && insideGraphZone) {
			const g_cluster = layout.g_radialGraph.g_cluster_atMouseLocation;
			const inner = get(w_ring_rotation_radius);
			const distance = mouse_vector.magnitude;
			const thick = k.ring_rotation_thickness;
			const thin = k.paging_arc_thickness;
			const rotate = inner + thick;
			const thumb = inner + thin;
			if (!!distance && distance <= rotate) {
				if (distance < inner) {
					ring_zone = T_RingZone.resize;
				} else if (distance < thumb && !!g_cluster && g_cluster.thumb_isHit) {
					ring_zone = T_RingZone.paging;
				} else {
					ring_zone = T_RingZone.rotate;
				}
			}
			debug.log_hover(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
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
