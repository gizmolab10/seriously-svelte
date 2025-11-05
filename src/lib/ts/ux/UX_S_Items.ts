import { h, p, u, debug, search, layout, details, controls } from '../common/Global_Imports';
import { w_t_startup, w_data_updated, w_search_state } from '../managers/Stores';
import { w_ancestry_forDetails, w_ancestry_focus } from '../managers/Stores';
import { S_Items, T_Search, T_Startup } from '../common/Global_Imports';
import { Tag, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { w_s_alteration, w_s_title_edit } from '../managers/Stores';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

type Identifiable_S_Items_Pair<T = Identifiable, U = S_Items<T>> = [T, U | null];

export default class UX_S_Items {

	si_recents = new S_Items<Identifiable_S_Items_Pair>([]);
	si_expanded = new S_Items<Ancestry>([]);
	si_grabs = new S_Items<Ancestry>([]);
	si_found = new S_Items<Thing>([]);

	parents_focus!: Ancestry;
	prior_focus!: Ancestry;

	//////////////////////////////
	//							//
	//	manage identifiables:	//
	//							//
	//	  recents, found,		//
	//	  details, focus,		//
	//	  expandeds, grabs,		//
	//							//
	//////////////////////////////

	constructor() {
		w_data_updated.subscribe((count: number) => {
			this.update_grabs_forSearch();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update_grabs_forSearch();
		});
		w_t_startup.subscribe((startup: number | null) => {
			if (startup == T_Startup.ready) {
				w_ancestry_focus.subscribe((ancestry: Ancestry) => {
					this.update_ancestry_forDetails();
				});
				w_search_state.subscribe((state: number | null) => {
					this.update_grabs_forSearch();
				});
				x.si_found.w_index.subscribe((row: number | null) => {
					this.update_grabs_forSearch();
				});
				this.update_grabs_forSearch();
			}
		});
	}
		
	static readonly _____ANCESTRY: unique symbol;

	get ancestry_forDetails(): Ancestry | null { return get(w_ancestry_forDetails); }
	
	grab_next_ancestry(next: boolean) {	// for next/previous in details selection banner
		if (get(w_search_state) > T_Search.off) {
			this.si_found.find_next_item(next);
		} else {
			this.si_grabs.find_next_item(next);
		}
		this.update_ancestry_forDetails();
		details.redraw();		// force re-render of details
	}

	update_ancestry_forDetails() {
		const presented = this.ancestry_forDetails;
		let ancestry = search.selected_ancestry;
		if (!ancestry) {
			const focus = get(w_ancestry_focus);
			const grab = this.si_grabs.item as Ancestry;
			ancestry = grab ?? focus ?? h.rootAncestry;
		}
		if (!presented || !presented.equals(ancestry)) {
			w_ancestry_forDetails.set(ancestry);
		}
	}
		
	static readonly _____FOCUS: unique symbol;

	ancestry_next_focusOn(next: boolean) {
		this.si_recents.find_next_item(next);
		const pair = this.si_recents.item as [Ancestry, S_Items<Ancestry> | null];
		if (!!pair && Array.isArray(pair) && pair.length == 2) {
			const [ancestry, si_grabs] = pair;
			if (!!ancestry) {
				w_ancestry_focus.set(ancestry);
				ancestry.expand();
			}
			if (!!si_grabs) {
				this.si_grabs = si_grabs;
			}
		}
	}

	ancestry_focusOn(ancestry: Ancestry): boolean {
		const priorFocus = get(w_ancestry_focus);
		const changed = !priorFocus || !ancestry.equals(priorFocus!);
		if (changed) {
			const pair: Identifiable_S_Items_Pair = [ancestry, this.si_grabs];
			this.si_recents.push(pair);
			w_s_alteration.set(null);
			w_ancestry_focus.set(ancestry);
			ancestry.expand();
			this.update_ancestry_forDetails();
		}
		return changed;
	}

	update_forFocus() {
		let focus = get(w_ancestry_focus);
		if (p.branches_areChildren) {
			this.parents_focus = focus;
			focus = this.prior_focus;
		} else {
			this.prior_focus = focus;
			focus = this.parents_focus ?? this.ancestry_forDetails;
		}
		focus?.becomeFocus();
	}
	
	static readonly _____GRABS: unique symbol;

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		this.si_grabs.items = [ancestry];
		h?.stop_alteration();
		this.update_ancestry_forDetails();
	}

	grab(ancestry: Ancestry) {
		let grabbed = this.si_grabs.items ?? [];
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
		this.si_grabs.items = grabbed;
		debug.log_grab(`  GRAB '${ancestry.title}'`);
		h?.stop_alteration();
		this.update_ancestry_forDetails();
	}

	ungrab(ancestry: Ancestry) {
		w_s_title_edit?.set(null);
		let grabbed = this.si_grabs.items ?? [];
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
		if (grabbed.length == 0 && controls.inTreeMode) {
			grabbed = [rootAncestry];
		} else {
			h?.stop_alteration(); // do not show editingActions for root
		}
		this.si_grabs.items = grabbed;
		debug.log_grab(`  UNGRAB '${ancestry.title}'`);
		this.update_ancestry_forDetails();
	}

	update_grabs_forSearch() {
		if (get(w_t_startup) == T_Startup.ready && get(w_search_state) != T_Search.off && this.si_found.length > 0) {
			let ancestries = this.si_found.items.map((found: Thing) => found.ancestry).filter(a => !!a) ?? [];
			ancestries = u.strip_hidDuplicates(ancestries);
			if (this.si_grabs.descriptionBy_sorted_IDs != u.descriptionBy_sorted_IDs(ancestries)) {
				this.si_grabs.items = ancestries;
				this.update_ancestry_forDetails();
			}
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

	static readonly _____TRAITS: unique symbol;
	
	//////////////////////////////////////////////////////////////////////
	//																	//
	//	traits are managed by Things									//
	//	si_thing_traits is the list of traits for ancestry_forDetails	//
	//	trait is the current trait (independent of ancestry_forDetails)	//
	//																	//
	//////////////////////////////////////////////////////////////////////

	select_next_thingTrait(next: boolean) { this.si_thing_traits.find_next_item(next); }
	get trait(): Trait | null { return h.si_traits.item as Trait | null; }
	get thing_trait(): Trait | null { return this.si_thing_traits?.item as Trait | null; }
	get si_thing_traits(): S_Items<Trait> { return this.ancestry_forDetails?.thing?.si_traits ?? new S_Items<Trait>([]); }
	
	select_next_trait(next: boolean) {
		const si_traits = h.si_traits;
		if (!!si_traits && si_traits.find_next_item(next)) {
			const ancestry = si_traits.item?.owner?.ancestry;
			if (!!ancestry && ancestry.ancestry_assureIsVisible()) {
				layout.grand_build();
				details.redraw();
			}
		}
	}
	
	static readonly _____TAGS: unique symbol;

	select_next_thing_tag(next: boolean) { this.si_thing_tags.find_next_item(next); }
	get si_thing_tags(): S_Items<Tag> { return this.ancestry_forDetails?.thing?.si_tags ?? new S_Items<Tag>([]); }

}

export const x = new UX_S_Items();
