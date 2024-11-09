import { s_show_details, s_graphRect, s_user_graphOffset, s_offset_graph_center } from './Reactive_State';
import { k, get, Rect, Size, Point, debug, persistLocal, IDPersistent } from '../common/Global_Imports';

class Window_State {
	scale_factor = 1;
	scroll = this.windowScroll;
	
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }
	get center_ofGraphRect(): Point { return get(s_graphRect).size.dividedInHalf.asPoint; }

	get user_offset(): Point {
		const point = persistLocal.read_key(IDPersistent.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}

	get windowSize(): Size {
		const ratio = this.scale_factor;
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
	}

	get windowDelta(): Point | null {
		const scroll = this.windowScroll;
		const delta = scroll.distanceFrom(this.scroll);
		if (delta.magnitude > 1) {
			this.scroll = scroll;
			return delta;
		}
		return null
	}

	restore_state() {
		this.applyScale(persistLocal.read_key(IDPersistent.scale) ?? 1);
		this.user_graphOffset_setTo(this.user_offset);
	}

	user_graphOffset_setTo(graphOffset: Point): boolean {
		if (get(s_user_graphOffset) != graphOffset) {
			persistLocal.write_key(IDPersistent.user_offset, graphOffset);
			const center = get(s_graphRect).size.dividedInHalf.asPoint;
			s_offset_graph_center.set(center.offsetBy(graphOffset));
			s_user_graphOffset.set(graphOffset);
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

export let w = new Window_State();
