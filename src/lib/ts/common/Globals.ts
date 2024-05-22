import { s_thing_changed, s_resize_count, s_mouse_up_count, s_mouse_location, s_user_graphOffset } from '../state/State';
import { s_graphRect, s_show_details, s_scale_factor, s_rebuild_count, s_cluster_arc_radius } from '../state/State';
import { k, u, get, Rect, Point, debug, builds, debugReact } from '../common/GlobalImports';
import { dbDispatch, persistLocal, IDPersistant } from '../common/GlobalImports';

class Globals {
	rebuild_count = 0;
	ring_startAngle: number | null = null;		// angle at location of mouse DOWN
	ring_priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	ring_radiusOffset: number | null = null;	// distance from arc radius to location of mouse DOWN

	setup() {
		builds.setup();
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		persistLocal.restore();
		k.queryStrings_apply();
		s_mouse_up_count.set(0);
		s_thing_changed.set(k.empty);
		persistLocal.queryStrings_apply();
		debug.queryStrings_apply();
		debugReact.queryStrings_apply();
		window.addEventListener('resize', (event) => {
			s_resize_count.set(get(s_resize_count) + 1)
			this.graphRect_update();
		});
		window.addEventListener('mouseup', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_up_count.set(get(s_mouse_up_count) + 1);
		});
		window.addEventListener('mousemove', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_location.set(new Point(event.clientX, event.clientY));
		});
	}

	get siteTitle(): string {
		const dbType = dbDispatch.db.dbType;
		const baseID = dbDispatch.db.baseID;
		const host = u.isServerLocal ? 'local' : 'remote';
		const db_name = dbType ? (dbType! + ', ') : k.empty;
		const base_name = baseID ? (baseID! + ', ') : k.empty;
		return `Seriously (${host}, ${db_name}${base_name}${u.browserType}, α)`;
	}

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		persistLocal.key_write(IDPersistant.scale, scale);
		this.applyScale(scale);
		return u.windowSize.width;
	}

	applyScale(scale: number) {
		s_scale_factor.set(scale)
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.transform = `scale(var(zoom))`;
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		this.graphRect_update();
	}

	graphRect_update() {
		const top = k.show_titleAtTop ? 114 : 69;							// height of content above the graph
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, top);
		const sizeOfGraph = u.windowSize.reducedBy(originOfGraph);		// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		s_graphRect.set(rect);											// used by Panel and Graph_Tree
	}

	graphOffset_setTo(origin: Point): boolean {
		if (get(s_user_graphOffset) != origin) {
			persistLocal.key_write(IDPersistant.origin, origin);
			s_user_graphOffset.set(origin);
			return true;
		}
		return false;
	}

}

export let g = new Globals();
