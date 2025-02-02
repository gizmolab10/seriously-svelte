import { w_hierarchy, w_ancestries_grabbed } from '../state/S_Stores';
import { Thing, Ancestry } from '../common/Global_Imports';
import { get } from 'svelte/store';

export default class Grabs {
	
	get grabs_latest_thing(): Thing | null { return this.grabs_latest_ancestry?.thing || null; }

	get areInvisible(): boolean {
		const ancestries = get(w_ancestries_grabbed) ?? [];
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get grabs_latest_ancestry(): Ancestry | null {
		const ancestries = get(w_ancestries_grabbed) ?? [];
		if (ancestries.length > 0) {
			const ancestry = ancestries.slice(-1)[0];	// does not alter ancestries
			const relationshipHID = ancestry?.relationship?.hid;
			if (!!relationshipHID && !!get(w_hierarchy).relationship_forHID(relationshipHID)) {
				return ancestry;
			}
		}
		return null;
	}

	grabs_latest_ancestry_upward(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = get(w_ancestries_grabbed) ?? [];
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return get(w_hierarchy).rootAncestry;
	}

}