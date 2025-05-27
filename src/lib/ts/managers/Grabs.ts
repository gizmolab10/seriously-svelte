import { w_ancestries_grabbed, w_ancestry_focus, w_hierarchy } from "../common/Stores";
import { show, Thing, layout, Ancestry } from "../common/Global_Imports";
import { get } from "svelte/store";

export class Grabs {

	// hierarchy depends on grabs, so we can't use h here

	ancestry_forInfo: Ancestry | null = get(w_hierarchy)?.rootAncestry ?? null;
	get latest_grab(): Ancestry | null { return this.grabs_latest_upward(true); }
	get grabs_latest_thing(): Thing | null { return this.grabs_latest_ancestry?.thing || null; }

	get grabs_areInvisible(): boolean {
		const ancestries = get(w_ancestries_grabbed) ?? [];
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get grabs_latest_ancestry(): Ancestry | null {
		const ancestry = this.grabs_latest_upward(false);
		const relationshipHID = ancestry?.relationship?.hid;
		if (!!relationshipHID && !!get(w_hierarchy).relationship_forHID(relationshipHID)) {
			return ancestry;
		}
		return null;
	}

	grabs_latest_assureIsVisible() {
		const ancestry = this.grabs_latest_ancestry;
		if (!!ancestry && !ancestry.isVisible) {
			if (layout.inTreeMode) {
				ancestry.reveal_toFocus();
			} else {
				ancestry.parentAncestry?.becomeFocus();
			}
		}
	}

	grabs_latest_upward(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = get(w_ancestries_grabbed) ?? [];
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return get(w_hierarchy)?.rootAncestry ?? null;
	}

	grabs_latest_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.grabs_latest_upward(up);
		if (!!ancestry) {
			get(w_hierarchy).ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
		}
	}

	private get hasGrabs(): boolean {
		const grabbed = get(w_ancestries_grabbed);
		if (!grabbed || grabbed.length === 0) { return false; }
		return !(get(w_ancestry_focus)?.isGrabbed ?? true);
	}

	update_forKind_ofInfo() {
		if (show.shows_focus || !this.hasGrabs) {
			this.ancestry_forInfo = get(w_ancestry_focus);
		} else {
			const latest_grab = this.grabs_latest_upward(true);
			if (!!latest_grab) {
				this.ancestry_forInfo = latest_grab;
			}
		}
	}
	
}

export const grabs = new Grabs();
