import { T_Drag, T_Startup, T_Preference, T_Hit_Target, T_Radial_Zone } from '../common/Global_Imports';
import { k, p, s, hits, debug, layout, signals, elements, g_radial } from '../common/Global_Imports';
import { G_Paging, G_Cluster, G_Thing_Pages } from '../common/Global_Imports';
import { Angle, S_Rotation, S_Resizing } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';

//////////////////////////////////
//								//
// 	manage rotation & resizing	//
//								//
//////////////////////////////////

export default class Radial_Graph {
	s_paging_rotation_byName: { [name: string]: S_Rotation } = {};
	g_thing_pages_byThingID: {[id: string]: G_Thing_Pages} = {};
	s_ring_resizing!: S_Resizing;
	s_ring_rotation!: S_Rotation;
	cursor = k.cursor_default;
	zone = T_Radial_Zone.miss;
	s_paging!: S_Rotation;
	last_action = 0;

	w_radial_ring_angle	 = writable<number>(0);
	w_g_paging			 = writable<G_Paging>();
	w_g_paging_cluster	 = writable<G_Cluster | null>(null);
	w_radial_ring_radius = writable<number>(k.radius.ring_minimum);
	
	constructor() {
		s.w_ancestry_focus.subscribe((ancestry) => {
			this.reset();
		});
	}

	reset_paging() { this.s_paging_rotations.map(s => s.reset()); }
	get s_paging_rotations(): Array<S_Rotation> { return Object.values(this.s_paging_rotation_byName); }
	get isAny_paging_arc_hovering(): boolean { return this.s_paging_rotations.some(s => s.isHovering); }
	get isAny_paging_thumb_dragging(): boolean { return this.s_paging_rotations.some(s => s.isDragging); }
	get isAny_rotation_dragging(): boolean { return this.isAny_paging_thumb_dragging || this.s_paging.isDragging || this.s_ring_rotation.isDragging; }
	s_paging_rotation_forName(name: string): S_Rotation { return elements.assure_forKey_inDict(name, this.s_paging_rotation_byName, () => new S_Rotation()); }
	
	g_thing_pages_forThingID(id: string | null | undefined): G_Thing_Pages | null {
		return !id ? null : elements.assure_forKey_inDict(id, this.g_thing_pages_byThingID, () => new G_Thing_Pages(id));
	}

	reset() {
		this.s_paging = new S_Rotation(T_Hit_Target.paging);
		this.s_ring_resizing = new S_Resizing();
		this.s_ring_rotation = new S_Rotation();
		this.w_g_paging_cluster.set(null);
		this.cursor = k.cursor_default;
		this.last_action = 0;
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
			case T_Radial_Zone.paging: return this.s_paging.cursor;
			case T_Radial_Zone.resize: return this.s_ring_resizing.cursor;
			case T_Radial_Zone.rotate: return this.s_ring_rotation.cursor;
			default:				   return k.cursor_default;
		}
	}

	update_fill_colors() {
		this.s_paging.update_fill_color();
		this.s_ring_rotation.update_fill_color();
		this.s_ring_resizing.update_fill_color();
	}

	detect_hovering(): boolean {
		let detected = false;
		const paging = this.s_paging;
		const rotate = this.s_ring_rotation;
		const resize = this.s_ring_resizing;
		const isRotating = rotate.isDragging;
		const isResizing = resize.isDragging;
		const ring_zone = this.ring_zone_atMouseLocation;
		const isPaging = this.isAny_paging_thumb_dragging;
		const inRotate = ring_zone == T_Radial_Zone.rotate && !isResizing && !isPaging;
		const inResize = ring_zone == T_Radial_Zone.resize && !isRotating && !isPaging;
		const inPaging = ring_zone == T_Radial_Zone.paging && !isRotating && !isResizing;
		if (rotate.isHovering != inRotate) {
			rotate.isHovering  = inRotate;
			debug.log_hits(` hover rotate  ${inRotate}`);
			detected = true;
		}
		if (resize.isHovering != inResize) {
			resize.isHovering  = inResize;
			debug.log_hits(` hover resize  ${inResize}`);
			detected = true;
		}
		if (paging.isHovering != inPaging) {
			paging.isHovering  = inPaging;
			debug.log_hits(` hover paging  ${inPaging}`);
			detected = true;
		}
		return detected;
	}

	detect_ring_movement() {
		const mouse_vector = layout.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			const now = new Date().getTime();
			const rotate = this.s_ring_rotation;
			const resize = this.s_ring_resizing;
			const mouse_angle = mouse_vector.angle;
			const g_cluster = get(this.w_g_paging_cluster);
			const s_paging_rotation = g_cluster?.s_paging_rotation;
			const is_dragging = rotate.isDragging || resize.isDragging || !!get(this.w_g_paging_cluster);		// must not overload DOM refresh
			if (is_dragging) {
				window.getSelection()?.removeAllRanges();		// Prevent text selection during dragging
			}
			if (!!resize && resize.isDragging && resize.basis_radius != null) {										// resize, check this FIRST (when both states return isDragging true, rotate should be ignored)
				const smallest = k.radius.ring_minimum;
				const largest = smallest * 3;
				const magnitude = mouse_vector.magnitude - resize.basis_radius;
				const distance = magnitude.force_between(smallest, largest);
				const ring_radius = get(this.w_radial_ring_radius);
				const delta = distance - ring_radius;
				const radius = ring_radius + delta;
				resize.active_angle = mouse_angle + Angle.quarter;
				this.cursor = resize.cursor;
				if (Math.abs(delta) > 1 && ((now - this.last_action) > 500)) {				// granularity of 1 pixel & 1 tenth second
					this.last_action = now;
					debug.log_radial(` resize  D ${distance.asInt()}  R ${radius.asInt()}  + ${delta.toFixed(1)}`);
					this.w_radial_ring_radius.set(radius);
					layout.grand_layout();
				}
			} else if (!!rotate && rotate.isDragging && rotate.basis_angle != null) {								// rotate clusters
				if (!signals.anySignal_isInFlight && ((now - this.last_action) > 75)) {		// 1 tenth second
					this.last_action = now;
					this.w_radial_ring_angle.set(mouse_angle.add_angle_normalized(-rotate.basis_angle));
					debug.log_radial(` rotate ${get(this.w_radial_ring_angle).asDegrees()}`);
					rotate.active_angle = mouse_angle;
					this.cursor = rotate.cursor;
					layout.grand_layout();										// reposition necklace widgets and arc sliders
				}
			} else if (!!g_cluster && !!s_paging_rotation && s_paging_rotation.active_angle != null) {
				const basis_angle = s_paging_rotation.basis_angle;
				const active_angle = s_paging_rotation.active_angle;
				const delta_angle = (active_angle - mouse_angle).angle_normalized_aroundZero();
				s_paging_rotation.active_angle = mouse_angle;
				this.cursor = s_paging_rotation.cursor;
				debug.log_radial(` page  ${delta_angle.asDegrees()}`);
				if (!!basis_angle && !!active_angle && basis_angle != active_angle && !!g_cluster && g_cluster.adjust_paging_index_byAdding_angle(delta_angle)) {
					layout.grand_layout();
				}
			}
		}
	}

	get ring_zone_atMouseLocation(): T_Radial_Zone {
		let ring_zone = T_Radial_Zone.miss;
		const hover_type = get(hits.w_s_hover)?.type;
		const mouse_vector = layout.mouse_vector_ofOffset_fromGraphCenter();
		const hasHovering_conflict = !!hover_type && [T_Hit_Target.widget, T_Hit_Target.drag].includes(hover_type);
		if (!!mouse_vector && !hasHovering_conflict) {
			const g_cluster = g_radial.g_cluster_atMouseLocation;
			const inner = get(this.w_radial_ring_radius);
			const distance = mouse_vector.magnitude;
			const thick = k.thickness.radial.ring;
			const thin = k.thickness.radial.arc;
			const outer = inner + thick;
			const thumb = inner + thin;
			if (!!distance) {
				if (distance < inner) {
					ring_zone = T_Radial_Zone.resize;
				} else if (distance < thumb && !!g_cluster && g_cluster.isMouse_insideThumb) {
					ring_zone = T_Radial_Zone.paging;
				} else if (distance <= outer) {
					ring_zone = T_Radial_Zone.rotate;
				}
			}
			debug.log_mouse(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
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
				hits.w_s_hover.subscribe((s_hover) => {
					this.update_fill_colors();
				});
				this.w_g_paging.subscribe((g_paging: G_Paging) => {
					p.writeDB_key(T_Preference.paging, this.g_thing_pages_byThingID);
					if (!!g_paging) {
						g_radial.layout_forPoints_toChildren(g_paging.points_toChildren);
						g_radial.layout_forPaging();
					}
				})
			}
		});
	}

}

export const radial = new Radial_Graph();