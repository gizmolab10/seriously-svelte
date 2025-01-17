import { s_hierarchy, s_ancestries_grabbed } from '../state/S_Stores';
import { Thing, Ancestry } from '../common/Global_Imports';
import { get } from 'svelte/store';

export default class Grabs {
	
	get thing_lastGrabbed(): Thing | null { return this.ancestry_lastGrabbed?.thing || null; }

	get areInvisible(): boolean {
		const ancestries = get(s_ancestries_grabbed) ?? [];
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get ancestry_lastGrabbed(): Ancestry | null {
		const ancestries = get(s_ancestries_grabbed) ?? [];
		if (ancestries.length > 0) {
			const ancestry = ancestries.slice(-1)[0];	// does not alter ancestries
			const relationshipHID = ancestry?.relationship?.hid;
			if (!!relationshipHID && !!get(s_hierarchy).relationship_forHID(relationshipHID)) {
				return ancestry;
			}
		}
		return null;
	}

	latestAncestryGrabbed(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = get(s_ancestries_grabbed) ?? [];
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return get(s_hierarchy).rootAncestry;
	}

}