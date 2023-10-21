import { get, Thing, Hierarchy, sort_byOrder } from "../common/GlobalImports";
import { idsGrabbed } from './State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Thing[] | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		idsGrabbed.subscribe((ids: string[] | undefined) => { // executes whenever idsGrabbed changes
			if (ids && this.hierarchy.db && this.hierarchy.db.hasData) {
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

	get last_thingGrabbed(): (Thing | null) { return this.hierarchy.thing_getForID(this.last_idGrabbed); }
	toggleGrab = (thing: Thing) => { if (thing.isGrabbed) { this.ungrab(thing); } else { this.grab(thing); } }

	get last_idGrabbed(): string | null {
		const ids = get(idsGrabbed);
		if (ids) {
			return ids.slice(-1)[0]
		}
		return null;
	}

	grabOnly = (thing: Thing) => {
		const ids = [thing.id]
		idsGrabbed.set(ids);
	}

	grab = (thing: Thing) => {
		idsGrabbed.update((array) => {
			if (array.indexOf(thing.id) == -1) {
				array.push(thing.id);	// only add if not already added
			}
			return array;
		});
	}

	ungrab = (thing: Thing) => {
		let nextGrabbedID: (string | null) = null;
		const rootID = this.hierarchy.idRoot;
		idsGrabbed.update((array) => {
			const index = array.indexOf(thing.id);
			if (index != -1) {				// only splice array when item is found
				array.splice(index, 1); // 2nd parameter means remove one item only
			}
			if (array.length == 0 && rootID) {
				array.push(rootID);
			}
			nextGrabbedID = array.slice(-1)[0];
			return array;
		});
		const ids = get(idsGrabbed);
		if (ids.length == 0) {
			this.hierarchy.root?.grabOnly();
		}
	}

	furthestGrab(up: boolean) {
		const ids = get(idsGrabbed);
		if (ids) {
			let grabs = this.hierarchy.things_getForIDs(ids);
			sort_byOrder(grabs);
			if (up) {
				return grabs[0];
			} else if (this.hierarchy.grabs.grabbed) {
				return grabs[this.hierarchy.grabs.grabbed.length - 1];
			}
		}
		return this.hierarchy.root;
	}

}