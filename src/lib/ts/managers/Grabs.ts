import { w_hierarchy, w_depth_limit, w_s_title_edit, w_s_alteration, w_search_state } from './Stores';
import { ux, x, debug, search, layout, Ancestry } from '../common/Global_Imports';
import { T_Search, S_Identifiables } from '../common/Global_Imports';
import { w_ancestry_focus, w_ancestry_forDetails } from './Stores';
import type { Identifiable_Pair } from '../types/Types';
import { s_details } from '../state/S_Details';
import { get } from 'svelte/store';

export class Grabs {
	// N.B. hierarchy depends on this, so we can't use h here

	get ancestry(): Ancestry | null {
		return (x.si_grabs.item as Ancestry) ?? this.latest_upward(true);
	}

	focusOn_next(next: boolean) {
		x.si_recents.find_next_item(next);
		const pair = x.si_recents.item as [Ancestry, S_Identifiables<Ancestry> | null];
		if (!!pair && Array.isArray(pair) && pair.length == 2) {
			const [ancestry, grabbed] = pair;
			if (!!ancestry) {
				w_ancestry_focus.set(ancestry);
				ancestry.expand();
			}
			if (!!grabbed) {
				x.si_grabs.copy_from(grabbed);
			}
		}
	}

	focusOn_ancestry(ancestry: Ancestry, force: boolean = false): boolean {
		const priorFocus = get(w_ancestry_focus);
		const changed = force || !priorFocus || !ancestry.equals(priorFocus!);
		if (changed) {
			const pair: Identifiable_Pair = [ancestry, x.si_grabs];
			x.si_recents.push(pair);
			w_s_alteration.set(null);
			w_ancestry_focus.set(ancestry);
		}
		ancestry.expand();
		x.update_ancestry_forDetails();
		return changed;
	}
	
	static readonly _____GRABS: unique symbol;
	
	grab_next_forSelection(next: boolean) {	// for next/previous in details selection banner
		if (get(w_search_state) > T_Search.off) {
			x.si_found.find_next_item(next);
		} else {
			x.si_grabs.find_next_item(next);
		}
		x.update_ancestry_forDetails();
		s_details.redraw();		// force re-render of details
	}

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		x.si_grabs.items = [ancestry];
		get(w_hierarchy)?.stop_alteration();
		x.update_ancestry_forDetails();
	}

	grab(ancestry: Ancestry) {
		let grabbed = x.si_grabs.items ?? [];
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
		x.si_grabs.items = grabbed;
		debug.log_grab(`  GRAB '${ancestry.title}'`);
		get(w_hierarchy)?.stop_alteration();
		x.update_ancestry_forDetails();
	}

	ungrab(ancestry: Ancestry) {
		w_s_title_edit?.set(null);
		let grabbed = x.si_grabs.items ?? [];
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
		x.si_grabs.items = grabbed;
		debug.log_grab(`  UNGRAB '${ancestry.title}'`);
		x.update_ancestry_forDetails();
	}
	
	static readonly _____LATEST: unique symbol;

	latest_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.latest_upward(up);
		if (!!ancestry) {
			get(w_hierarchy).ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
		}
	}

	latest_upward(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = x.si_grabs.items ?? [];
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
		const ancestry = this.ancestry;
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
