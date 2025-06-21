import { ux, Thing, debug, layout, Ancestry, S_Identifiables } from '../common/Global_Imports';
import { w_hierarchy, w_ancestry_focus, w_ancestries_grabbed } from '../common/Stores';
import { w_s_text_edit, w_depth_limit } from '../common/Stores';
import { get } from 'svelte/store';

export class Grabs {
	// N.B. hierarchy depends on grabs, so we can't use h here
	recents = new S_Identifiables<Ancestry>([]);
	
	focus_onNext(next: boolean) {
		this.recents.find_next_item(next);
		const ancestry = this.recents.item;
		if (!!ancestry) {
			w_ancestry_focus.set(ancestry);
			ancestry.expand();
		}
	}
	
	static readonly _____GRAB: unique symbol;

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
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
		debug.log_grab(`  GRAB '${ancestry.title}'`);
		get(w_hierarchy)?.stop_alteration();
	}

	ungrab(ancestry: Ancestry) {
		w_s_text_edit?.set(null);
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
		if (grabbed.length == 0 && ux.inTreeMode) {
			grabbed = [rootAncestry];
		} else {
			get(w_hierarchy)?.stop_alteration(); // do not show editingActions for root
		}
		w_ancestries_grabbed.set(grabbed);
		debug.log_grab(`  UNGRAB '${ancestry.title}'`);
	}
	
	static readonly _____LATEST: unique symbol;

	get latest_thing(): Thing | null { return this.latest?.thing || null; }
	get latest(): Ancestry | null { return this.latest_upward(true); }

	latest_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.latest_upward(up);
		if (!!ancestry) {
			get(w_hierarchy).ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
		}
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

	latest_assureIsVisible() {
		const ancestry = this.latest;
		if (!!ancestry && !ancestry.isVisible) {
			ancestry.grab();
			if (ux.inTreeMode) {
				const focusAncestry = ancestry.ancestry_createUnique_byStrippingBack(get(w_depth_limit));
				focusAncestry?.becomeFocus();
				ancestry.reveal_toFocus();
			} else {
				ancestry.parentAncestry?.becomeFocus();
				ancestry.assure_isVisible_within(ancestry.sibling_ancestries);
			}
			layout.grand_build();
		}
	}

}

export const grabs = new Grabs();
