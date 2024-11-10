import { k, get, Rect, Size, Point, debug, persistLocal, IDPersistent } from '../common/Global_Imports';
import { s_show_details, s_graphRect, s_mouse_location } from '../state/Reactive_State';
import { s_user_graphOffset, s_offset_graph_center } from '../state/Reactive_State';

class Window_Geometry {
	scale_factor = 1;
	scroll = this.windowScroll;
	
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }
	get center_ofGraphSize(): Point { return get(s_graphRect).size.dividedInHalf.asPoint; }
	get mouse_vector_fromGraphCenter(): Point | null { return this.mouse_vector_ofOffset_fromGraphCenter(); }
	get mouse_distance_fromGraphCenter(): number { return this.mouse_vector_fromGraphCenter?.magnitude ?? 0; }
	get mouse_angle_fromGraphCenter(): number | null { return this.mouse_vector_fromGraphCenter?.angle ?? null; }

	get persisted_user_offset(): Point {
		const point = persistLocal.read_key(IDPersistent.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}

	get windowSize(): Size {
		const ratio = this.scale_factor;
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
	}

	restore_state() {
		this.graphRect_update();
		this.user_graphOffset_setTo(this.persisted_user_offset);
		this.applyScale(persistLocal.read_key(IDPersistent.scale) ?? 1);
	}

	mouse_vector_ofOffset_fromGraphCenter(offset: Point = Point.zero): Point | null {
		const mouse_location = get(s_mouse_location)?.multipliedBy(w.scale_factor);
		if (!!mouse_location) {
			const mouse_vector = mouse_location.vector_from(get(s_offset_graph_center).offsetBy(offset));
			debug.log_rings(`${mouse_vector.description} ${offset.description}`);
			return mouse_vector;
		}
		return null
	}

	user_graphOffset_setTo(user_offset: Point): boolean {
		if (get(s_user_graphOffset) != user_offset) {
			const center = get(s_graphRect)?.center;
			s_user_graphOffset.set(user_offset);
			persistLocal.write_key(IDPersistent.user_offset, user_offset);
			s_offset_graph_center.set(center.offsetBy(user_offset));
			return true;
		}
		return false;
	}

	graphRect_update() {
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, 69);						// 69 = height of content above the graph
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);	// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		debug.log_action(` graphRect_update ${rect.description} STATE`);
		s_graphRect.set(rect);											// used by Panel and Graph_Tree
	}

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		persistLocal.write_key(IDPersistent.scale, scale);
		this.applyScale(scale);
		return this.windowSize.width;
	}

	applyScale(scale: number) {
		this.scale_factor = scale;
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.transform = `scale(var(zoom))`;
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		this.graphRect_update();
	}

}

export let w = new Window_Geometry();
