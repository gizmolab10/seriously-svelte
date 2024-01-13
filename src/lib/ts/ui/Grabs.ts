import { get, Path, Thing, Hierarchy } from "../common/GlobalImports";
import { paths_grabbed, path_toolsGrab } from '../managers/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Array<Path> | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		paths_grabbed.subscribe((paths: Array<Path>) => { // executes whenever paths_grabbed changes
			if (paths.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = paths;
			} else {
				this.grabbed = null;
			}
		});
	};


	toggleGrab(path: Path) { if (this.grabbed?.includes(path)) { path.ungrab(); } else { path.grab(); } }
	get thing_lastGrabbed(): (Thing | null) { return this.hierarchy.thing_getForPath(this.path_lastGrabbed); }

	get path_lastGrabbed(): Path | null {
		const paths = get(paths_grabbed);
		if (paths) {
			return paths.slice(-1)[0];	// not alter paths
		}
		return null;
	}

	latestPath(up: boolean): Path | null {
		const paths = get(paths_grabbed);
		if (paths) {
			if (up) {
				return paths[0];
			} else {
				return paths.slice(-1)[0];	// not alter array
			}
		}
		const idRoot = this.hierarchy.idRoot
		return !idRoot ? null : new Path(idRoot);
	}

}