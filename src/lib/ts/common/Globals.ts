import { k, u, get, Path, Rect, Point, Thing, launch, dbDispatch, Hierarchy, persistLocal, IDPersistant } from '../../ts/common/GlobalImports';
import { s_db_type, s_path_here, s_graphRect, s_show_details, s_paths_grabbed, s_scale_factor } from './State';

class Globals {
	titleIsAtTop: boolean = false;
	showControls: boolean = false;
	hierarchy: Hierarchy;
	rootPath: Path;
	herePath: Path;
	root: Thing;
	here: Thing;

	setup_reacts() {
		s_path_here.subscribe((herePath: Path) => {
			if (herePath && herePath != this.herePath) {
				this.here = herePath.thing ?? this.root;
				this.herePath = herePath;
			}
		})
		s_db_type.subscribe((type: string) => {
			if (type && dbDispatch.db.dbType != type) {
				(async () => {
					s_path_here.set(this.rootPath);
					s_paths_grabbed.set([]);
					dbDispatch.updateDBForType(type);
					await dbDispatch.applyQueryStrings(launch.queryString);
					await dbDispatch.updateHierarchy(type);
				})()
			}
		});
	}

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		persistLocal.writeToKey(IDPersistant.scale, scale);
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
		const top = g.titleIsAtTop ? 114 : 69;							// height of content above the graph
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, top);
		const sizeOfGraph = u.windowSize.reducedBy(originOfGraph);		// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		s_graphRect.set(rect);											// used by Panel and Graph
	};

}

export let g = new Globals();
