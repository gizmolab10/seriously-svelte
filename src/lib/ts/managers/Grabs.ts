import { get, Thing, Ancestry } from '../common/Global_Imports';
import { s_grabbed_color, s_ancestries_grabbed } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export default class Grabs {
	grabbed: Array<Ancestry> | null = null;
	unsubscribe: any;

	constructor() {
		this.update_forGrabbed(get(s_ancestries_grabbed));
		this.unsubscribe = s_ancestries_grabbed.subscribe((ancestries: Array<Ancestry>) => { // executes whenever s_ancestries_grabbed changes
			this.update_forGrabbed(ancestries);
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
		if (ancestries.length > 0) {
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
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return h.rootAncestry;
	}

	update_forGrabbed(ancestries: Array<Ancestry>) {
		if (!ancestries || ancestries.length == 0) {
			this.grabbed = null;
			s_grabbed_color.set(null);
		} else {
			this.grabbed = ancestries;
			s_grabbed_color.set(ancestries[0].thing?.color ?? null);
		}
	}

}