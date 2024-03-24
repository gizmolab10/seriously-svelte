import { g, get, Path, Thing, Hierarchy } from "../common/GlobalImports";
import { s_paths_grabbed } from '../common/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Array<Path> | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		s_paths_grabbed.subscribe((paths: Array<Path>) => { // executes whenever s_paths_grabbed changes
			if (paths && paths.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = paths;
			} else {
				this.grabbed = null;
			}
		});
	};

	get thing_lastGrabbed(): Thing | null { return this.hierarchy.thing_get_byPath(this.path_lastGrabbed); }

	get areInvisible(): boolean {
		const paths = get(s_paths_grabbed);
		for (const path of paths) {
			if (!path.isVisible) {
				return true;
			}
		}
		return false;
	}

	get path_lastGrabbed(): Path | null {
		const paths = get(s_paths_grabbed);
		if (paths && paths.length > 0) {
			const path = paths.slice(-1)[0];	// does not alter paths
			const relationshipHID = path?.relationship?.hashedID;
			if (relationshipHID && this.hierarchy.relationship_byHID[relationshipHID] != null) {
				return path;
			}
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
		return g.rootPath;
	}

}