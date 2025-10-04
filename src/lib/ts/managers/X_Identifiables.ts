import { h, ux, search, Thing, layout, Ancestry, debug } from '../common/Global_Imports';
import { T_Search, T_Startup, S_Identifiables } from '../common/Global_Imports';
import { w_t_startup, w_search_state, w_depth_limit } from './Stores';
import { w_ancestry_forDetails, w_ancestry_focus } from './Stores';
import { w_s_alteration, w_s_title_edit } from './Stores';
import type { Identifiable_Pair } from '../types/Types';
import { get } from 'svelte/store';

export default class X_Identifiables {

	si_recents = new S_Identifiables<Identifiable_Pair>([]);
	si_expanded = new S_Identifiables<Ancestry>([]);
	si_grabs = new S_Identifiables<Ancestry>([]);
	si_found = new S_Identifiables<Thing>([]);

	parents_focus_ancestry!: Ancestry;
	attached_branches: string[] = [];
	prior_focus_ancestry!: Ancestry;

	//////////////////////////
	//						//
	//	manage				//
	//	  grab, expand,		//
	//	  recent, search,	//
	//	  details			//
	//						//
	//////////////////////////

	constructor() {
		w_t_startup.subscribe((startup: number | null) => {
			if (startup == T_Startup.ready) {
				this.grabs_update_forSearch();
				w_search_state.subscribe((row: number | null) => {
					this.grabs_update_forSearch();
						});
				w_ancestry_focus.subscribe((ancestry: Ancestry) => {
					this.ancestry_update_forDetails();
				});
			}
		});
	}

	get ancestry_forDetails(): Ancestry | null { return get(w_ancestry_forDetails); }

	private grabs_update_forSearch() {
		if (get(w_search_state) != T_Search.off) {
			const items = this.si_found.items.map(result => result.ancestry) ?? [];
			if (this.si_grabs.items.map(a => a.id).join(',') != items.map(a => a.id).join(',')) {
				this.si_grabs.items = items;
			}
		}
	}
		
	static readonly _____FOCUS: unique symbol;

	ancestry_next_focusOn(next: boolean) {
		this.si_recents.find_next_item(next);
		const pair = this.si_recents.item as [Ancestry, S_Identifiables<Ancestry> | null];
		if (!!pair && Array.isArray(pair) && pair.length == 2) {
			const [ancestry, grabbed] = pair;
			if (!!ancestry) {
				w_ancestry_focus.set(ancestry);
				ancestry.expand();
			}
			if (!!grabbed) {
				this.si_grabs.copy_from(grabbed);
			}
		}
	}

	ancestry_focusOn(ancestry: Ancestry, force: boolean = false): boolean {
		const priorFocus = get(w_ancestry_focus);
		const changed = force || !priorFocus || !ancestry.equals(priorFocus!);
		if (changed) {
			const pair: Identifiable_Pair = [ancestry, this.si_grabs];
			this.si_recents.push(pair);
			w_s_alteration.set(null);
			w_ancestry_focus.set(ancestry);
		}
		ancestry.expand();
		this.ancestry_update_forDetails();
		return changed;
	}
	
	static readonly _____GRABS: unique symbol;

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		x.si_grabs.items = [ancestry];
		h?.stop_alteration();
		x.ancestry_update_forDetails();
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
		h?.stop_alteration();
		x.ancestry_update_forDetails();
	}

	ungrab(ancestry: Ancestry) {
		w_s_title_edit?.set(null);
		let grabbed = x.si_grabs.items ?? [];
		const rootAncestry = h?.rootAncestry;
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
			h?.stop_alteration(); // do not show editingActions for root
		}
		x.si_grabs.items = grabbed;
		debug.log_grab(`  UNGRAB '${ancestry.title}'`);
		x.ancestry_update_forDetails();
	}

	ancestry_update_forDetails() {
		const presented = this.ancestry_forDetails;
		let ancestry = search.selected_ancestry;
		if (!ancestry) {
			const focus = get(w_ancestry_focus);
			const grab = this.si_grabs.item as Ancestry;
			const grab_containsFocus = !!grab && !!focus && focus.isAProgenyOf(grab)
			ancestry = (!!grab && !grab_containsFocus) ? grab : focus;
		}
		if (!presented || !presented.equals(ancestry)) {
			w_ancestry_forDetails.set(ancestry);
		}
	}

	ancestry_grabbed_atEnd_upward(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = this.si_grabs.items ?? [];
		if (ancestries.length > 0) {
			if (up) {
				return ancestries[0];
			} else {
				return ancestries.slice(-1)[0];
			}
		}
		return h?.rootAncestry ?? null;
	}

	ancestry_assureIsVisible(ancestry: Ancestry) {
		if (!!ancestry && !ancestry.isVisible) {
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

export const x = new X_Identifiables();
