import { h, p, u, debug, search, layout, details, controls } from '../common/Global_Imports';
import { w_s_alteration, w_s_title_edit, w_thing_traits } from '../managers/Stores';
import { S_Items, T_Detail, T_Search, T_Startup } from '../common/Global_Imports';
import { w_t_startup, w_data_updated, w_search_state } from '../managers/Stores';
import { w_ancestry_forDetails, w_ancestry_focus } from '../managers/Stores';
import { Tag, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { w_show_details_ofType } from '../managers/Stores';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

type Identifiable_S_Items_Pair<T = Identifiable, U = S_Items<T>> = [T, U | null];

export default class UX_S_Items {

	si_recents = new S_Items<Identifiable_S_Items_Pair>([]);
	si_trait_things = new S_Items<Thing>([]);
	si_expanded = new S_Items<Ancestry>([]);
	si_grabs = new S_Items<Ancestry>([]);
	si_found = new S_Items<Thing>([]);
	si_tags = new S_Items<Tag>([]);

	parents_focus!: Ancestry;
	prior_focus!: Ancestry;

	//////////////////////////////
	//							//
	//	manage identifiables:	//
	//							//
	//	  recents, found,		//
	//	  details, focus,		//
	//	  expandeds,		//
	//	  tags, traits			//
	//							//
	//////////////////////////////

	constructor() {
		w_data_updated.subscribe((count: number) => {
			this.update();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Detail>) => {
			this.update();
		});
		w_t_startup.subscribe((startup: number | null) => {
			if (startup == T_Startup.ready) {
				w_ancestry_focus.subscribe((ancestry: Ancestry) => {
					this.ancestry_update_forDetails();
				});
				w_search_state.subscribe((state: number | null) => {
					this.grabs_update_forSearch();
				});
				x.si_found.w_index.subscribe((row: number | null) => {
					this.update();
				});
				this.update();
			}
		});
	}

	update() {
		if (get(w_t_startup) == T_Startup.ready) {
			this.grabs_update_forSearch();
			this.traitThings_update();
			this.tags_update();
		}
	}
		
	static readonly _____ANCESTRY: unique symbol;

	get ancestry_forDetails(): Ancestry | null { return get(w_ancestry_forDetails); }
	
	ancestry_select_next(next: boolean) {	// for next/previous in details selection banner
		if (get(w_search_state) > T_Search.off) {
			this.si_found.find_next_item(next);
		} else {
			this.si_grabs.find_next_item(next);
		}
		this.ancestry_update_forDetails();
		details.redraw();		// force re-render of details
	}

	ancestry_update_forDetails() {
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

	ancestry_focusOn(ancestry: Ancestry, force: boolean = false): boolean {
		const priorFocus = get(w_ancestry_focus);
		const changed = force || !priorFocus || !ancestry.equals(priorFocus!);
		if (changed) {
			const pair: Identifiable_S_Items_Pair = [ancestry, this.si_grabs];
			this.si_recents.push(pair);
			w_s_alteration.set(null);
			w_ancestry_focus.set(ancestry);
		}
		ancestry.expand();
		this.ancestry_update_forDetails();
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
		this.ancestry_update_forDetails();
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
		this.ancestry_update_forDetails();
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
		this.ancestry_update_forDetails();
	}

	grabs_update_forSearch() {
		if (get(w_search_state) != T_Search.off && this.si_found.length > 0) {
			let ancestries = this.si_found.items.map((found: Thing) => found.ancestry).filter(a => !!a) ?? [];
			ancestries = u.strip_hidDuplicates(ancestries);
			if (this.si_grabs.descriptionBy_sorted_IDs != u.descriptionBy_sorted_IDs(ancestries)) {
				this.si_grabs.items = ancestries;
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

	get traitThing(): Thing | null {
		const item = this.si_trait_things.item;
		if (!!item) {
			return item as Thing;
		}
		return null;
	}
	
	traitThing_select_next(next: boolean) {
		if (this.si_trait_things.find_next_item(next)) {
			const ancestry = this.traitThing?.ancestry;
			if (!!ancestry) {
				ancestry.grabOnly();	// causes reaction (invoking update())
				if (ancestry.ancestry_assureIsVisible()) {
					layout.grand_build();
				}
			}
		}
	}

	traitThings_update() {

		////////////////////////////////////////////////////////////////
		//															  //
		//	trait_things				  ALL things that have traits //
		//	w_thing_traits	JUST traits of the current ancestry.thing //
		//															  //
		////////////////////////////////////////////////////////////////

		let thing_traits: Array<Trait> = [];
		if (!!h) {
			this.si_trait_things.items = h.things_unique_havingTraits ?? [];
			const thing = get(w_ancestry_forDetails)?.thing;
			thing_traits = thing?.si_traits?.items ?? [];
			if (!!thing && thing_traits.length > 0) {
				// compute which index [trait] corresponds to the thing
				const index = this.si_trait_things.items.findIndex((t: Thing) => t.id == thing.id);
				this.si_trait_things.index = Math.max(0, index);
			}
		}
		w_thing_traits.set(thing_traits);
	}
	
	static readonly _____TAGS: unique symbol;

	tag_select_next(next: boolean): boolean {
		return this.si_tags.find_next_item(next);
	}

	tags_update() {
		const hid = get(w_ancestry_forDetails)?.thing?.hid;
		const si_tags = (!hid && hid != 0) ? h.si_tags : h.si_tags_forThingHID(hid);
		if (!si_tags) {
			this.si_tags.reset();
		} else if (si_tags.descriptionBy_sorted_IDs != this.si_tags.descriptionBy_sorted_IDs) {
			this.si_tags = si_tags;
		}
	}

}

export const x = new UX_S_Items();
