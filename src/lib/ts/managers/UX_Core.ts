import { T_Detail, T_Search, T_Kinship, T_Startup, T_Graph, T_Search_Preference } from '../common/Global_Imports';
import { w_t_startup, w_depth_limit, w_data_updated, w_search_state, w_search_preferences } from './Stores';
import { c, h, p, u, Tag, Thing, Trait, debug, search, layout, Ancestry } from '../common/Global_Imports';
import { w_show_related, w_show_tree_ofType, w_show_graph_ofType, w_show_details_ofType } from './Stores';
import { w_ancestry_forDetails, w_ancestry_focus, w_thing_traits } from './Stores';
import { w_s_alteration, w_s_title_edit } from './Stores';
import { S_Items } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { s_banners } from '../state/S_Banners';
import { get } from 'svelte/store';

type Identifiable_S_Items_Pair<T = Identifiable, U = S_Items<T>> = [T, U | null];

export default class X_Core {

	si_recents = new S_Items<Identifiable_S_Items_Pair>([]);
	si_trait_things = new S_Items<Thing>([]);
	si_expanded = new S_Items<Ancestry>([]);
	si_grabs = new S_Items<Ancestry>([]);
	si_found = new S_Items<Thing>([]);
	si_tags = new S_Items<Tag>([]);

	parents_focus_ancestry!: Ancestry;
	prior_focus_ancestry!: Ancestry;

	//////////////////////////
	//						//
	//	manage				//
	//	  grab, expand,		//
	//	  recent, search,	//
	//	  details, focus	//
	//	  trees, depth,		//
	//	  graphs			//
	//						//
	//////////////////////////

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
					this.ancestry_focus_update_forDetails();
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
			this.traitThings_update();
			this.grabs_update_forSearch();
			this.si_tags.items = get(w_ancestry_forDetails)?.thing?.tags ?? [];
		}
	}
		
	static readonly _____DETAILS: unique symbol;

	get ancestry_forDetails(): Ancestry | null { return get(w_ancestry_forDetails); }

	ancestry_focus_update_forDetails() {
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
		
	static readonly _____FOCUS: unique symbol;

	ancestry_next_focusOn(next: boolean) {
		this.si_recents.find_next_item(next);
		const pair = this.si_recents.item as [Ancestry, S_Items<Ancestry> | null];
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
			const pair: Identifiable_S_Items_Pair = [ancestry, this.si_grabs];
			this.si_recents.push(pair);
			w_s_alteration.set(null);
			w_ancestry_focus.set(ancestry);
		}
		ancestry.expand();
		this.ancestry_focus_update_forDetails();
		return changed;
	}
	
	static readonly _____GRABS: unique symbol;

	grabOnly(ancestry: Ancestry) {
		debug.log_grab(`  GRAB ONLY '${ancestry.title}'`);
		this.si_grabs.items = [ancestry];
		h?.stop_alteration();
		this.ancestry_focus_update_forDetails();
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
		this.ancestry_focus_update_forDetails();
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
		if (grabbed.length == 0 && c.inTreeMode) {
			grabbed = [rootAncestry];
		} else {
			h?.stop_alteration(); // do not show editingActions for root
		}
		this.si_grabs.items = grabbed;
		debug.log_grab(`  UNGRAB '${ancestry.title}'`);
		this.ancestry_focus_update_forDetails();
	}

	grabs_update_forSearch() {
		if (get(w_search_state) != T_Search.off) {
			const ancestries = this.si_found.items.map((result: Thing) => result.ancestry) ?? [];
			if (u.description_byID(this.si_grabs.items) != u.description_byID(ancestries)) {
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

	static readonly _____TRAIT_THINGS: unique symbol;

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
			thing_traits = thing?.traits ?? [];
			if (!!thing && thing_traits.length > 0) {
				// compute which index [trait] corresponds to the thing
				const index = this.si_trait_things.items.findIndex((t: Thing) => t.id == thing.id);
				this.si_trait_things.index = Math.max(0, index);
			}
		}
		w_thing_traits.set(thing_traits);
	}
	
	static readonly _____TAGS: unique symbol;

	get tag(): Tag | null { return (this.si_tags.item as Tag) ?? null; }
	tag_select_next(next: boolean): boolean { return this.si_tags.find_next_item(next); }

	
	static readonly _____ANCESTRIES: unique symbol;
	
	ancestry_select_next(next: boolean) {	// for next/previous in details selection banner
		if (get(w_search_state) > T_Search.off) {
			x.si_found.find_next_item(next);
		} else {
			x.si_grabs.find_next_item(next);
		}
		x.ancestry_focus_update_forDetails();
		s_banners.redraw();		// force re-render of details
	}

	static readonly _____GRAPHS: unique symbol;

	increase_depth_limit_by(increment: number) {
		w_depth_limit.update(a => a + increment);
		layout.grand_layout();
	}
	
	handle_choiceOf_t_graph(name: string, types: string[]) {
		switch (name) {
			case 'graph': w_show_graph_ofType.set(types[0] as unknown as T_Graph); break;
			case 'filter': w_search_preferences.set(types[0] as unknown as T_Search_Preference); break;
			case 'tree': this.set_tree_types(types as Array<T_Kinship>); break;
		}
	}

	toggle_graph_type() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree:   w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree);   break;
		}
		layout.grand_sweep();
	}

	set_tree_types(t_trees: Array<T_Kinship>) {
		if (t_trees.length == 0) {
			t_trees = [T_Kinship.children];
		}
		w_show_tree_ofType.set(t_trees);
		let focus_ancestry = get(w_ancestry_focus);
		if (p.branches_areChildren) {
			this.parents_focus_ancestry = focus_ancestry;
			focus_ancestry = this.prior_focus_ancestry;
		} else {
			this.prior_focus_ancestry = focus_ancestry;
			focus_ancestry = this.parents_focus_ancestry ?? this.ancestry_forDetails;
		}
		w_show_related.set(t_trees.includes(T_Kinship.related));
		focus_ancestry?.becomeFocus();
		p.restore_expanded();
		layout.grand_build();
	}

}

export const x = new X_Core();
