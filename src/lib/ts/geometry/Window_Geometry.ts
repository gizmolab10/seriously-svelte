import { k, Rect, Size, Point, debug, signals, persistLocal, IDPersistent } from '../common/Global_Imports';
import { s_graphRect, s_user_graph_offset, s_user_graph_center } from '../state/Svelte_Stores';
import { s_show_details, s_scaled_mouse_location } from '../state/Svelte_Stores';
import { get } from 'svelte/store';

class Window_Geometry {
	scale_factor = 1;
	scroll = this.windowScroll;
	
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }
	get center_ofGraphSize(): Point { return get(s_graphRect).size.asPoint.dividedInHalf; }
	renormalize_user_graph_offset() { this.user_graph_offset_setTo(this.persisted_user_offset); }
	get mouse_distance_fromGraphCenter(): number { return this.mouse_vector_ofOffset_fromGraphCenter()?.magnitude ?? 0; }
	get mouse_angle_fromGraphCenter(): number | null { return this.mouse_vector_ofOffset_fromGraphCenter()?.angle ?? null; }

	get persisted_user_offset(): Point {
		const point = persistLocal.read_key(IDPersistent.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}

	get windowSize(): Size {
		const ratio = this.scale_factor;
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
	}

	restore_state() {
		this.graphRect_update();	// needed for applyScale
		this.applyScale(persistLocal.read_key(IDPersistent.scale) ?? 1);
		this.renormalize_user_graph_offset();	// must be called after apply scale (which fubars offset)
	}

	mouse_vector_ofOffset_fromGraphCenter(offset: Point = Point.zero): Point | null {
		const mouse_location = get(s_scaled_mouse_location);
		if (!!mouse_location) {
			const center_offset = get(s_user_graph_center).offsetBy(offset);
			const mouse_vector = center_offset.vector_to(mouse_location);
			debug.log_cursor(`${mouse_vector.description} offset`);
			return mouse_vector;
		}
		return null
	}

	user_graph_offset_setTo(user_offset: Point): boolean {
		if (get(s_user_graph_offset) != user_offset) {
			const center_offset = get(s_graphRect).center.offsetBy(user_offset);
			persistLocal.write_key(IDPersistent.user_offset, user_offset);
			s_user_graph_center.set(center_offset);
			s_user_graph_offset.set(user_offset);
			return true;
		}
		return false;
	}

	graphRect_update() {
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, 69);						// 69 = height of content above the graph
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);	// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		debug.log_action(` graphRect_update ${rect.description} GEOMETRY`);
		s_graphRect.set(rect);											// used by Panel and Graph_Tree
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
		persistLocal.write_key(IDPersistent.scale, scale);
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.transform = `scale(var(zoom))`;
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		this.graphRect_update();
	}

}

export let w = new Window_Geometry();