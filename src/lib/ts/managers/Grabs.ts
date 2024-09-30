import { get, Thing, Ancestry } from '../common/Global_Imports';
import { s_grabbed_ancestries } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export default class Grabs {
	
	get thing_lastGrabbed(): Thing | null { return h.thing_forAncestry(this.ancestry_lastGrabbed); }

	get areInvisible(): boolean {
		const ancestries = get(s_grabbed_ancestries);
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get ancestry_lastGrabbed(): Ancestry | null {
		const ancestries = get(s_grabbed_ancestries);
		if (ancestries.length > 0) {
			const ancestry = ancestries.slice(-1)[0];	// does not alter ancestries
			const relationshipHID = ancestry?.relationship?.idHashed;
			if (!!relationshipHID && !!h.relationship_forHID(relationshipHID)) {
				return ancestry;
			}
		}
		return null;
	}

	latestAncestryGrabbed(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = get(s_grabbed_ancestries);
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return h.rootAncestry;
	}

}