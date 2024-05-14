import { k, u, get, Rect, Point, debug, builds } from '../common/GlobalImports';
import { debugReact, dbDispatch, persistLocal, IDPersistant } from '../common/GlobalImports';
import { s_graphRect, s_show_details, s_scale_factor, s_user_graphOffset } from '../state/State';

class Globals {
	mouseLocation!: Point;

	setup() {
		const dbType = dbDispatch.db.dbType;
		const baseID = dbDispatch.db.baseID;
		const host = u.isServerLocal ? 'local' : 'remote';
		const db_name = dbType ? (dbType! + ', ') : k.empty;
		const base_name = baseID ? (baseID! + ', ') : k.empty;
		document.title = `Seriously (${host}, ${db_name}${base_name}${u.browserType}, α)`;
		builds.setup();
		persistLocal.restore();
		k.queryStrings_apply();
		persistLocal.queryStrings_apply();
		debug.queryStrings_apply();
		debugReact.queryStrings_apply();
		window.addEventListener('resize', (event) => { this.graphRect_update(); });
		window.addEventListener('mousemove', (event: MouseEvent) => {
			this.mouseLocation = new Point(event.clientX, event.clientY);
		});
		window.addEventListener('mousedown', (event: MouseEvent) => {
			// alert('mousedown');
		});
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
