import { k, p, Rect, Size, Point, debug, wrappers, T_RingZone, T_Preference, T_SvelteComponent } from '../common/Global_Imports';
import { w_graph_rect, w_show_details, w_user_graph_offset, w_user_graph_center } from '../common/Stores';
import { w_ring_rotation_radius, w_mouse_location_scaled } from '../common/Stores';
import { get } from 'svelte/store';

export class G_Window {
	scale_factor = 1;
	
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }
	get center_ofGraphSize(): Point { return get(w_graph_rect).size.asPoint.dividedInHalf; }
	renormalize_user_graph_offset() { this.user_graph_offset_setTo(this.persisted_user_offset); }
	get mouse_distance_fromGraphCenter(): number { return this.mouse_vector_ofOffset_fromGraphCenter()?.magnitude ?? 0; }
	get mouse_angle_fromGraphCenter(): number | null { return this.mouse_vector_ofOffset_fromGraphCenter()?.angle ?? null; }

	get persisted_user_offset(): Point {
		const point = p.read_key(T_Preference.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}

	get windowSize(): Size {
		const ratio = this.scale_factor;
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
	}
	
	get ringZone_atMouseLocation(): T_RingZone {
		let ring_zone = T_RingZone.miss;
		const mouse_vector = w.mouse_vector_ofOffset_fromGraphCenter();
		const widgets = wrappers.wrappers_ofType_atMouseLocation(T_SvelteComponent.widget);
		if (!!mouse_vector && widgets.length == 0) {
			const distance = mouse_vector.magnitude;
			const thick = k.ring_rotation_thickness;
			const inner = get(w_ring_rotation_radius);
			const thin = k.paging_arc_thickness;
			const resize = inner + thick * 2;
			const rotate = inner + thick;
			const thumb = inner - thin;
			if (!!distance && distance <= resize) {
				if (distance > rotate) {
					ring_zone = T_RingZone.resize;
				} else if (distance > inner) {
					ring_zone = T_RingZone.rotate;
				} else if (distance > thumb) {
					ring_zone = T_RingZone.paging;
				}
			}
			debug.log_hover(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
	}

	restore_state() {
		this.graphRect_update();	// needed for applyScale
		this.applyScale(p.read_key(T_Preference.scale) ?? 1);
		this.renormalize_user_graph_offset();	// must be called after apply scale (which fubars offset)
	}

	mouse_vector_ofOffset_fromGraphCenter(offset: Point = Point.zero): Point | null {
		const mouse_location = get(w_mouse_location_scaled);
		if (!!mouse_location) {
			const center_offset = get(w_user_graph_center).offsetBy(offset);
			const mouse_vector = center_offset.vector_to(mouse_location);
			debug.log_hover(`offset  ${get(w_user_graph_offset).verbose}  ${mouse_vector.verbose}`);
			return mouse_vector;
		}
		return null
	}

	user_graph_offset_setTo(user_offset: Point): boolean {
		let changed = false;
		const current_offset = get(w_user_graph_offset);
		if (!!current_offset && current_offset.vector_to(user_offset).magnitude > .001) {
			p.write_key(T_Preference.user_offset, user_offset);
			changed = true;
		}
		const center_offset = get(w_graph_rect).center.offsetBy(user_offset);
		w_user_graph_center.set(center_offset);
		w_user_graph_offset.set(user_offset);
		debug.log_mouse(`USER ====> ${user_offset.verbose}  ${center_offset.verbose}`);
		return changed;
	}

	graphRect_update() {
		const left = get(w_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, 69);						// 69 = height of content above the graph
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);	// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		debug.log_mouse(`GRAPH ====> ${rect.description}`);
		w_graph_rect.set(rect);											// used by Panel and Graph_Tree
	}

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		this.applyScale(scale);
		return this.windowSize.width;
	}

	applyScale(scale: number) {
		this.scale_factor = scale;
		p.write_key(T_Preference.scale, scale);
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.transform = `scale(var(zoom))`;
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		this.graphRect_update();
	}

}

export let w = new G_Window();
