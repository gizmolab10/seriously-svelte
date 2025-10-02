import { ux, debug, search, layout, Ancestry } from '../common/Global_Imports';
import { w_hierarchy, w_depth_limit, w_s_title_edit } from './Stores';
import { T_Search, T_Startup } from '../common/Global_Imports';
import { w_s_alteration, w_ancestry_focus } from './Stores';
import { w_t_startup, w_search_state } from './Stores';
import type { Ancestry_Pair } from '../types/Types';
import { s_details } from '../state/S_Details';
import { get } from 'svelte/store';

export class Grabs {
	// N.B. hierarchy depends on this, so we can't use h here

	constructor() {
		ux.s_grabbed_ancestries.w_items.subscribe((array: Array<Ancestry>) => {
			if (get(w_t_startup) == T_Startup.ready) {
				this.update();
			}
		});
		w_search_state.subscribe((row: number | null) => {
			if (get(w_t_startup) == T_Startup.ready) {
				this.update();
			}
		});
		w_t_startup.subscribe((startup: number | null) => {
			if (startup == T_Startup.ready) {
				this.update();
			}
		});
	}

	private update() {
		if (get(w_search_state) != T_Search.off) {
			const items = search?.results.map(result => result.ancestry) ?? [];
			ux.s_grabbed_ancestries.items = items;
		}
	}

	get index_ofAncestry(): number { return ux.s_grabbed_ancestries.index; }

	get ancestry(): Ancestry | null {
		return (ux.s_grabbed_ancestries.item as Ancestry) ?? this.latest_upward(true);
	}

	get ancestry_forInformation(): Ancestry {
		const search_ancestry = search.result_ancestry;
		if (!!search_ancestry) {
			return search_ancestry;
		}
		const focus = get(w_ancestry_focus);
		const grab = this.ancestry;
		const grab_containsFocus = !!grab && !!focus && focus.isAProgenyOf(grab)
		return (!!grab && !grab_containsFocus) ? grab : focus;
	}

	focus_onNext(next: boolean) {
		ux.recents.find_next_item(next);
		const item = ux.recents.item;
		if (!!item && Array.isArray(item) && item.length >= 2) {
			const [ancestry, grabbed] = item;
			if (!!ancestry) {
				w_ancestry_focus.set(ancestry);
				ancestry.expand();
			}
			if (!!grabbed) {
				this.grabOnly(grabbed);
			}
		}
	}

	focusOn_ancestry(ancestry: Ancestry, force: boolean = false): boolean {
		const priorFocus = get(w_ancestry_focus);
		const changed = force || !priorFocus || !ancestry.equals(priorFocus!);
		if (changed) {
			const pair: Ancestry_Pair = [ancestry, this.ancestry];
			ux.recents.push(pair);
			w_s_alteration.set(null);
			w_ancestry_focus.set(ancestry);
		}
		ancestry.expand();
		return changed;
	}
	
	static readonly _____GRABS: unique symbol;

	isGrabbed(ancestry: Ancestry): boolean { return this.ancestry_forInformation.equals(ancestry); }
	
	grab_next(next: boolean) {	// for next/previous in details selection banner
		ux.s_grabbed_ancestries.find_next_item(next);
		s_details.redraw();		// force re-render of details
	}

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		ux.s_grabbed_ancestries.items = [ancestry];
		get(w_hierarchy)?.stop_alteration();
	}

	grab(ancestry: Ancestry) {
		let grabbed = ux.s_grabbed_ancestries.items ?? [];
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
		ux.s_grabbed_ancestries.items = grabbed;
		debug.log_grab(`  GRAB '${ancestry.title}'`);
		get(w_hierarchy)?.stop_alteration();
	}

	ungrab(ancestry: Ancestry) {
		w_s_title_edit?.set(null);
		let grabbed = ux.s_grabbed_ancestries.items ?? [];
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
		ux.s_grabbed_ancestries.items = grabbed;
		debug.log_grab(`  UNGRAB '${ancestry.title}'`);
	}
	
	static readonly _____LATEST: unique symbol;

	latest_rebuild_persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const ancestry = this.latest_upward(up);
		if (!!ancestry) {
			get(w_hierarchy).ancestry_rebuild_persistentMoveUp_maybe(ancestry, up, SHIFT, OPTION, EXTREME);
		}
	}

	latest_upward(up: boolean): Ancestry | null {	// does not alter array
		const ancestries = ux.s_grabbed_ancestries.items ?? [];
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
