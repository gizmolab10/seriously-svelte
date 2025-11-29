import { G_Paging, G_Cluster, G_Thing_Pages, T_Radial_Zone, T_Preference, T_Startup, layout, T_Hit_Target } from '../common/Global_Imports';
import { k, p, s, hits, debug, elements, g_radial } from '../common/Global_Imports';
import { S_Rotation, S_Resizing } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';

//////////////////////////////////
//								//
// 	manage rotating & resizing	//
//								//
//////////////////////////////////

export default class Radial_Graph {
	s_paging_rotation_byName: { [name: string]: S_Rotation } = {};
	g_thing_pages_byThingID: {[id: string]: G_Thing_Pages} = {};
	s_cluster_rotation = new S_Rotation();
	s_ring_resizing	= new S_Resizing();
	s_radial_ring	= new S_Rotation();
	zone = T_Radial_Zone.miss;

	w_radial_ring_angle	 = writable<number>(0);
	w_g_paging			 = writable<G_Paging>();
	w_g_paging_cluster	 = writable<G_Cluster | null>(null);
	w_radial_ring_radius = writable<number>(k.radius.ring_minimum);

	reset_paging() { this.s_paging_rotations.map(s => s.reset()); }
	get s_paging_rotations(): Array<S_Rotation> { return Object.values(this.s_paging_rotation_byName); }
	get isAny_paging_arc_active(): boolean { return this.s_paging_rotations.filter(s => s.isActive).length > 0; }
	get isAny_paging_arc_hovering(): boolean { return this.s_paging_rotations.filter(s => s.isHovering).length > 0; }
	get isAny_rotation_active(): boolean { return this.isAny_paging_arc_active || this.s_cluster_rotation.isActive || this.s_radial_ring.isActive; }
	s_paging_rotation_forName(name: string): S_Rotation { return elements.assure_forKey_inDict(name, this.s_paging_rotation_byName, () => new S_Rotation()); }
	
	g_thing_pages_forThingID(id: string | null | undefined): G_Thing_Pages | null {
		return !id ? null : elements.assure_forKey_inDict(id, this.g_thing_pages_byThingID, () => new G_Thing_Pages(id));
	}

	reset() {
		this.s_ring_resizing.reset();
		this.s_radial_ring.reset();
		this.reset_paging();
	}

	createAll_thing_pages_fromDict(dict: Dictionary | null) {
		if (!!dict) {
			for (const sub_dict of Object.values(dict)) {
				const g_thing_pages = G_Thing_Pages.create_fromDict(sub_dict);
				if (!!g_thing_pages) {
					this.g_thing_pages_byThingID[g_thing_pages.thing_id] = g_thing_pages;
				}
			}
		}
	}

	get cursor_forRingZone(): string {
		switch (this.ring_zone_atMouseLocation) {
			case T_Radial_Zone.paging: return this.s_cluster_rotation.cursor;
			case T_Radial_Zone.resize: return this.s_ring_resizing.cursor;
			case T_Radial_Zone.rotate: return this.s_radial_ring.cursor;
			default:				   return k.cursor_default;
		}
	}

	restore_radial_preferences() {
		this.w_radial_ring_angle.set( p.read_key(T_Preference.ring_angle) ?? 0);
		this.w_radial_ring_radius.set( Math.max( p.read_key(T_Preference.ring_radius) ?? 0, k.radius.ring_minimum));
		s.w_t_startup.subscribe((startup) => {
			if (startup == T_Startup.ready) {
				this.w_radial_ring_angle.subscribe((angle: number) => {
					p.write_key(T_Preference.ring_angle, angle);
				});
				this.w_radial_ring_radius.subscribe((radius: number) => {
					p.write_key(T_Preference.ring_radius, radius);
				});
				this.w_g_paging.subscribe((g_paging: G_Paging) => {
					p.writeDB_key(T_Preference.paging, radial.g_thing_pages_byThingID);
					if (!!g_paging) {
						g_radial.layout_forPoints_toChildren(g_paging.points_toChildren);
						g_radial.layout_forPaging();
					}
				})
			}
		});
	}

	get ring_zone_atMouseLocation(): T_Radial_Zone {
		let ring_zone = T_Radial_Zone.miss;
		const mouse_vector = layout.mouse_vector_ofOffset_fromGraphCenter();
		const widgets = hits.hits_atPoint_ofType(mouse_vector, T_Hit_Target.widget);
		if (!!mouse_vector && widgets.length == 0) {
			const g_cluster = g_radial.g_cluster_atMouseLocation;
			const inner = get(this.w_radial_ring_radius);
			const distance = mouse_vector.magnitude;
			const thick = k.thickness.radial.ring;
			const thin = k.thickness.radial.arc;
			const rotate = inner + thick;
			const thumb = inner + thin;
			if (!!distance && distance <= rotate) {
				if (distance < inner) {
					ring_zone = T_Radial_Zone.resize;
				} else if (distance < thumb && !!g_cluster && g_cluster.isMouse_insideThumb) {
					ring_zone = T_Radial_Zone.paging;
				} else {
					ring_zone = T_Radial_Zone.rotate;
				}
			}
			debug.log_mouse(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
	}

}

export const radial = new Radial_Graph();