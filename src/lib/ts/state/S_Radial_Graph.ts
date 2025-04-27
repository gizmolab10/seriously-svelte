import { S_Rotation, S_Expansion, S_Thing_Pages } from '../common/Global_Imports';
import { k, u, w, debug, layout, wrappers } from '../common/Global_Imports';
import { T_RingZone, T_SvelteComponent } from '../common/Global_Imports';
import { w_ring_rotation_radius } from '../common/Stores';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

//////////////////////////////////////////////////////////////////
//																//
// 	track into which zone the mouse last went down				//
// 	so that if it comes up in a different zone,					//
// 	we can reset the state for the first zone					//
//																//
// 	WHY? ring z-index is above paging z-index,					//
// 	and latter's mouse up must not be captured by former		//
//																//
// 	N.B., must ignore up in case of detection of a double click	//
//																//
//////////////////////////////////////////////////////////////////

export default class S_Radial_Graph {
	s_paging_rotation_byName: { [name: string]: S_Rotation } = {};
	s_thing_pages_byThingID: {[id: string]: S_Thing_Pages} = {};
	s_cluster_rotation = new S_Rotation();
	s_ring_resizing	= new S_Expansion();
	s_ring_rotation	= new S_Rotation();
	zone = T_RingZone.miss;

	reset_paging() { this.s_paging_rotations.map(s => s.reset()); }
	get s_paging_rotations(): Array<S_Rotation> { return Object.values(this.s_paging_rotation_byName); }
	get isAny_paging_arc_active(): boolean { return this.s_paging_rotations.filter(s => s.isActive).length > 0; }
	get isAny_paging_arc_hovering(): boolean { return this.s_paging_rotations.filter(s => s.isHovering).length > 0; }
	get isAny_rotation_active(): boolean { return this.isAny_paging_arc_active || radial.s_cluster_rotation.isActive || radial.s_ring_rotation.isActive; }
	s_paging_rotation_forName(name: string): S_Rotation { return u.assure_forKey_inDict(name, this.s_paging_rotation_byName, () => new S_Rotation()); }
	
	s_thing_pages_forThingID(id: string | null | undefined): S_Thing_Pages | null {
		return !id ? null : u.assure_forKey_inDict(id, this.s_thing_pages_byThingID, () => new S_Thing_Pages(id));
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

	get ring_zone_atMouseLocation(): T_RingZone {
		let ring_zone = T_RingZone.miss;
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		const widgets = wrappers.wrappers_ofType_atMouseLocation(T_SvelteComponent.widget);
		if (!!mouse_vector && widgets.length == 0) {
			const g_cluster = layout.g_radialGraph.g_cluster_atMouseLocation;
			const inner = get(w_ring_rotation_radius);
			const distance = mouse_vector.magnitude;
			const thick = k.thickness.ring_rotation;
			const thin = k.thickness.paging_arc;
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
			debug.log_mouse(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
	}

}

export const radial = new S_Radial_Graph();