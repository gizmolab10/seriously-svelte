import { get, Thing, Hierarchy } from "../common/GlobalImports";
import { ids_grabbed, id_toolsGrab } from '../managers/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: string[] | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		ids_grabbed.subscribe((paths: string[]) => { // executes whenever ids_grabbed changes
			if (paths.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = paths;
			}
		});
	};

	get thing_lastGrabbed(): (Thing | null) { return this.hierarchy.thing_getForPath(this.last_idGrabbed); }
	toggleGrab = (path: string) => { if (this.grabbed?.includes(path)) { this.ungrab(path); } else { this.grab(path); } }

	private toggleToolsGrab(path: string) {
		const paths = get(id_toolsGrab);
		if (paths != null) {
			if (paths.includes(path)) {
				id_toolsGrab.set(null);
			} else {
				id_toolsGrab.set(path);
			}
		}
	}

	get last_idGrabbed(): string | null {
		const ids = get(ids_grabbed);
		if (ids) {
			return ids.slice(-1)[0];	// not alter ids
		}
		return null;
	}

	grabOnly(path: string) {
		ids_grabbed.set([path]);
		this.toggleToolsGrab(path);
	}

	grab(path: string) {
		ids_grabbed.update((array) => {
			if (array.indexOf(path) == -1) {
				array.push(path);	// only add if not already added
			}
			return array;
		});
		this.toggleToolsGrab(path);
	}

	ungrab(path: string) {
		const rootID = this.hierarchy.idRoot;
		ids_grabbed.update((array) => {
			const index = array.indexOf(path);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (array.length == 0 && rootID) {
				array.push(rootID);
			}
			return array;
		});
		let paths = get(ids_grabbed);
		if (paths.length == 0 && rootID) {
			this.grabOnly(rootID);
		} else {
			this.toggleToolsGrab(path); // do not show tools cluster for root
		}
	}

	latestPath(up: boolean): string | null {
		const paths = get(ids_grabbed);
		if (paths) {
			if (up) {
				return paths[0];
			} else {
				return paths.slice(-1)[0];	// not alter array
			}
		}
		return this.hierarchy.idRoot;
	}

}