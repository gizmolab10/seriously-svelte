import { get, Path, Thing, Hierarchy } from "../common/GlobalImports";
import { paths_grabbed, path_toolsGrab } from '../managers/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Path[] | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		paths_grabbed.subscribe((paths: Path[]) => { // executes whenever paths_grabbed changes
			if (paths.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = paths;
			}
		});
	};

	get thing_lastGrabbed(): (Thing | null) { return this.hierarchy.thing_getForPath(this.last_idGrabbed); }
	toggleGrab = (path: Path) => { if (this.grabbed?.includes(path)) { this.ungrab(path); } else { this.grab(path); } }

	private toggleToolsGrab(path: Path) {
		const paths = get(path_toolsGrab);
		if (paths != null) {
			if (paths.includes(path)) {
				path_toolsGrab.set(null);
			} else {
				path_toolsGrab.set(path);
			}
		}
	}

	get last_idGrabbed(): Path | null {
		const ids = get(paths_grabbed);
		if (ids) {
			return ids.slice(-1)[0];	// not alter ids
		}
		return null;
	}

	grabOnly(path: Path) {
		paths_grabbed.set([path]);
		this.toggleToolsGrab(path);
	}

	grab(path: Path) {
		paths_grabbed.update((array) => {
			if (array.indexOf(path) == -1) {
				array.push(path);	// only add if not already added
			}
			return array;
		});
		this.toggleToolsGrab(path);
	}

	ungrab(path: Path) {
		const rootID = this.hierarchy.idRoot;
		paths_grabbed.update((array) => {
			const index = array.indexOf(path);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (array.length == 0 && rootID) {
				array.push(rootID);
			}
			return array;
		});
		let paths = get(paths_grabbed);
		if (paths.length == 0 && rootID) {
			this.grabOnly(rootID);
		} else {
			this.toggleToolsGrab(path); // do not show tools cluster for root
		}
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