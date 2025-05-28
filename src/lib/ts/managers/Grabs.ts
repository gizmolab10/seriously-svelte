import { w_hierarchy, w_s_title_edit, w_ancestry_focus, w_ancestries_grabbed } from "../common/Stores";
import { u, show, Thing, debug, layout, Ancestry } from "../common/Global_Imports";
import { get } from "svelte/store";

export class Grabs {

	// hierarchy depends on grabs, so we can't use h here

	ancestry_forInfo: Ancestry | null = get(w_hierarchy)?.rootAncestry ?? null;
	get latest_grab(): Ancestry | null { return this.latest_upward(true); }
	get latest_thing(): Thing | null { return this.latest?.thing || null; }

	get areInvisible(): boolean {
		const ancestries = get(w_ancestries_grabbed) ?? [];
		for (const ancestry of ancestries) {
			if (!ancestry.isVisible) {
				return true;
			}
		}
		return false;
	}

	get latest(): Ancestry | null {
		const ancestry = this.latest_upward(false);
		const relationshipHID = ancestry?.relationship?.hid;
		if (!!relationshipHID && !!get(w_hierarchy).relationship_forHID(relationshipHID)) {
			return ancestry;
		}
		return null;
	}

	latest_assureIsVisible() {
		const ancestry = this.latest;
		if (!!ancestry && !ancestry.isVisible) {
			if (layout.inTreeMode) {
				ancestry.reveal_toFocus();
			} else {
				ancestry.grab();
				ancestry.parentAncestry?.becomeFocus();
				this.assure_ancestry_isVisible_within(ancestry, ancestry.sibling_ancestries);
			}
		}
	}

	assure_ancestry_isVisible_within(ancestry: Ancestry, ancestries: Array<Ancestry>) {
		if (!!ancestry.predicate) {
			const index = u.indexOf_withMatchingThingID_in(ancestry, ancestries);
			const g_paging = ancestry.g_cluster?.g_paging;
			if (!!g_paging && !g_paging.index_isVisible(index)) {
				return g_paging.update_index_toShow(index);		// change paging
			}
		}
		return false;
	}

	latest_upward(up: boolean): Ancestry | null {	// does not alter array
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

	latest_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.latest_upward(up);
		if (!!ancestry) {
			get(w_hierarchy).ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
		}
	}

	update_forKind_ofInfo() {
		if (show.shows_focus || !this.hasGrabs) {
			this.ancestry_forInfo = get(w_ancestry_focus);
		} else {
			const latest_grab = this.latest_upward(true);
			if (!!latest_grab) {
				this.ancestry_forInfo = latest_grab;
			}
		}
	}

	private get hasGrabs(): boolean {
		const grabbed = get(w_ancestries_grabbed);
		if (!grabbed || grabbed.length === 0) { return false; }
		return !(get(w_ancestry_focus)?.isGrabbed ?? true);
	}
	
	static readonly _____GRAB: unique symbol;

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY "${ancestry.title}"`);
		w_ancestries_grabbed.set([ancestry]);
		get(w_hierarchy)?.stop_alteration();
	}

	grab(ancestry: Ancestry) {
		let grabbed = get(w_ancestries_grabbed) ?? [];
		if (!!grabbed) {
			const index = grabbed.indexOf(ancestry);
			if (grabbed.length == 0) {
				grabbed.push(ancestry);
			} else if (index != grabbed.length - 1) {	// not already last?
				if (index != -1) {					// found: remove
					grabbed.splice(index, 1);
				}
				grabbed.push(ancestry);					// always add last
			}
		}
		w_ancestries_grabbed.set(grabbed);
		debug.log_grab(`  GRAB "${ancestry.title}"`);
		get(w_hierarchy)?.stop_alteration();
	}

	ungrab(ancestry: Ancestry) {
		w_s_title_edit?.set(null);
		let grabbed = get(w_ancestries_grabbed) ?? [];
		const rootAncestry = get(w_hierarchy)?.rootAncestry;
		if (!!grabbed) {
			const index = grabbed.indexOf(ancestry);
			if (index != -1) {				// only splice grabbed when item is found
				grabbed.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (grabbed.length == 0) {
				grabbed.push(rootAncestry);
			}
		}
		if (grabbed.length == 0 && layout.inTreeMode) {
			grabbed = [rootAncestry];
		} else {
			get(w_hierarchy)?.stop_alteration(); // do not show editingTools for root
		}
		w_ancestries_grabbed.set(grabbed);
		debug.log_grab(`  UNGRAB "${ancestry.title}"`);
	}

}

export const grabs = new Grabs();
