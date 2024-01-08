import { get, Hierarchy, Relationship, sort_byOrder } from "../common/GlobalImports";
import { ids_grabbed, id_toolsGrab } from '../managers/State';

export default class Grabs {
	hierarchy: Hierarchy;
	grabbed: Relationship[] | null = null;

	constructor(hierarchy: Hierarchy) {
		this.hierarchy = hierarchy;
		ids_grabbed.subscribe((ids: string[]) => { // executes whenever ids_grabbed changes
			if (ids.length > 0 && this.hierarchy.db && this.hierarchy.db.hasData) {
				this.grabbed = [];
				for (const id of ids) {
					const relationship = this.hierarchy.relationship_getForID(id)
					if (relationship) {
						this.grabbed.push(relationship);
					}
				}
			}
		});
	};

	get relationship_lastGrabbed(): (Relationship | null) { return this.hierarchy.relationship_getForID(this.last_idGrabbed); }
	toggleGrab = (relationship: Relationship) => { if (relationship.isGrabbed) { this.ungrab(relationship); } else { this.grab(relationship); } }

	relationship_toggleToolsGrab(relationship: Relationship) {
		const id = get(id_toolsGrab);
		if (id != null) {
			if (id == relationship.id) {
				id_toolsGrab.set(null);
			} else {
				id_toolsGrab.set(relationship.id);
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

	grabOnly(relationship: Relationship) {
		const ids = [relationship.id]
		ids_grabbed.set(ids);
		this.relationship_toggleToolsGrab(relationship);
	}

	grab(relationship: Relationship) {
		ids_grabbed.update((array) => {
			if (array.indexOf(relationship.id) == -1) {
				array.push(relationship.id);	// only add if not already added
			}
			return array;
		});
		this.relationship_toggleToolsGrab(relationship);
	}

	ungrab(relationship: Relationship) {
		const rootID = this.hierarchy.idRoot;
		ids_grabbed.update((array) => {
			const index = array.indexOf(relationship.id);
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
		this.relationship_toggleToolsGrab(relationship);
	}

	latestGrab(up: boolean): Relationship {
		const ids = get(ids_grabbed);
		if (ids) {
			let grabs = this.hierarchy.relationships_getForIDs(ids);
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