import { get, Thing, Ancestry } from "../common/GlobalImports";
import { s_ancestries_grabbed } from '../state/Stores';
import { h } from '../db/DBDispatch';

export default class Grabs {
	grabbed: Array<Ancestry> | null = null;
	unsubscribe: any;

	constructor() {
		this.unsubscribe = s_ancestries_grabbed.subscribe((ancestries: Array<Ancestry>) => { // executes whenever s_ancestries_grabbed changes
			if (!!ancestries && ancestries.length > 0 && h.db && h.db.hasData) {
				this.grabbed = ancestries;
			} else {
				this.grabbed = null;
			}
		});
	};

	destroy() { this.unsubscribe(); }
	get thing_lastGrabbed(): Thing | null { return h.thing_forAncestry(this.ancestry_lastGrabbed); }

	get areInvisible(): boolean {
		const ancestries = get(s_ancestries_grabbed);
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get ancestry_lastGrabbed(): Ancestry | null {
		const ancestries = get(s_ancestries_grabbed);
		if (!!ancestries && ancestries.length > 0) {
			const ancestry = ancestries.slice(-1)[0];	// does not alter ancestries
			const relationshipHID = ancestry?.relationship?.idHashed;
			if (relationshipHID && !!h.relationship_forHID(relationshipHID)) {
				return ancestry;
			}
		}
		return null;
	}

	latestAncestryGrabbed(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = get(s_ancestries_grabbed);
		if (!!ancestries) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return h.rootAncestry;
	}

}