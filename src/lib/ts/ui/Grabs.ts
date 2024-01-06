import { get, Thing, Hierarchy, sort_byOrder, Relationship } from "../common/GlobalImports";
import { ids_grabbed, id_toolsGrab } from '../managers/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Thing[] | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		ids_grabbed.subscribe((ids: string[]) => { // executes whenever ids_grabbed changes
			if (ids.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = [];
				for (const id of ids) {
					const thing = this.hierarchy.thing_getForID(id)
					if (thing) {
						this.grabbed.push(thing);
					}
				}
			}
		});
	};

	get thing_lastGrabbed(): (Thing | null) { return this.hierarchy.thing_getForID(this.last_idGrabbed); }
	toggleGrab = (thing: Thing) => { if (thing.isGrabbed) { this.ungrab(thing); } else { this.grab(thing); } }

	thing_toggleToolsGrab(thing: Thing) {
		const id = get(id_toolsGrab);
		if (id != null) {
			if (id == thing.id) {
				id_toolsGrab.set(null);
			} else {
				id_toolsGrab.set(thing.id);
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

	grabOnly(thing: Thing) {
		const ids = [thing.id]
		ids_grabbed.set(ids);
		this.thing_toggleToolsGrab(thing);
	}

	grab(thing: Thing) {
		ids_grabbed.update((array) => {
			if (array.indexOf(thing.id) == -1) {
				array.push(thing.id);	// only add if not already added
			}
			return array;
		});
		this.thing_toggleToolsGrab(thing);
	}

	ungrab(thing: Thing) {
		const rootID = this.hierarchy.idRoot;
		ids_grabbed.update((array) => {
			const index = array.indexOf(thing.id);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (array.length == 0 && rootID) {
				array.push(rootID);
			}
			return array;
		});
		const ids = get(ids_grabbed);
		if (ids.length == 0) {
			this.hierarchy.root?.grabOnly();
		}
		this.thing_toggleToolsGrab(thing);
	}

	latestGrab(up: boolean) {
		const ids = get(ids_grabbed);
		if (ids) {
			let grabs = this.hierarchy.things_getForIDs(ids);
			sort_byOrder(grabs);
			if (up) {
				return grabs[0];
			} else {
				return grabs.slice(-1)[0];	// not alter array
			}
		}
		return this.hierarchy.root;
	}

}