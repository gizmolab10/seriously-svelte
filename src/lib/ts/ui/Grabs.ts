import { get, Path, Thing, Hierarchy } from "../common/GlobalImports";
import { s_paths_grabbed, s_path_toolsGrab } from '../managers/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Array<Path> | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		s_paths_grabbed.subscribe((paths: Array<Path>) => { // executes whenever s_paths_grabbed changes
			if (paths.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = paths;
			} else {
				this.grabbed = null;
			}
		});
	};

	get thing_lastGrabbed(): (Thing | null) { return this.hierarchy.thing_getForPath(this.path_lastGrabbed); }

	get path_lastGrabbed(): Path | null {
		const paths = get(s_paths_grabbed);
		if (paths) {
			return paths.slice(-1)[0];	// not alter paths
		}
		return null;
	}

	latestPathGrabbed(up: boolean): Path | null {	// does not alter array
		const paths = get(s_paths_grabbed);
		if (paths) {
			if (up) {
				return paths[0];
			} else {
				return paths.slice(-1)[0];
			}
		}
		return this.hierarchy.rootPath;
	}

}