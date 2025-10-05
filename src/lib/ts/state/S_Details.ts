import { T_Search, T_Detail, T_Startup, T_Direction, T_Storage_Need } from '../common/Global_Imports';
import { w_search_results_found, w_count_details, w_ancestry_forDetails } from '../managers/Stores';
import { h,	x, Tag, Thing, Trait, Ancestry, S_Items } from '../common/Global_Imports';
import { w_t_startup, w_search_state, w_show_details_ofType } from '../managers/Stores';
import { w_thing_traits, w_ancestry_focus, w_data_updated } from '../managers/Stores';
import { S_Banner_Hideable } from './S_Banner_Hideable';
import { get, Writable } from 'svelte/store';

class S_Details {
	private s_banner_hideables_byType: { [t_detail: string]: S_Banner_Hideable } = {};
	private s_trait_things = new S_Items<Thing>([]);
	private grabbed_ancestries!: Writable<Array<Ancestry>>;
	private s_tags = new S_Items<Tag>([]);
	t_storage_need = T_Storage_Need.direction;
	show_properties = false;

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
				this.update();
				x.si_found.w_index.subscribe((row: number | null) => {
					this.update();
				});
			}
		});
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			this.s_banner_hideables_byType[t_detail] = new S_Banner_Hideable(t_detail);
		}
	}

	private update() {
		if (get(w_t_startup) == T_Startup.ready) {
			this.traitThings_update();
			this.grabbed_ancestries = x.si_grabs.w_items;
			this.s_tags.items = get(w_ancestry_forDetails)?.thing?.tags ?? [];
		}
	}

	redraw() { w_count_details.update(n => n + 1); }	// force re-render of details
	
	static readonly _____BANNERS: unique symbol;

	banner_update(banner_id: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts
		const t_detail = T_Detail[banner_id as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	 this.traitThing_select_next(next); break;
			case T_Detail.selection: this.ancestry_select_next(next); break;
			case T_Detail.tags:  	 this.tag_select_next(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const normal_title = T_Detail[t_detail];
		switch (t_detail) {	
			case T_Detail.selection:
				const row	  = x.si_found.index;
				const matches = get(w_search_results_found);
				const grabbed = get(this.grabbed_ancestries);
				if (row != null && !!matches && matches > 1) {
					return row.of_n_for_type(matches, 'search result', '');
				} else if (!!grabbed) {
					switch (grabbed.length) {
						case 1:  break;
						case 0:  return 'focus';
						default: return x.si_grabs.index.of_n_for_type(grabbed.length, 'selected', '');
					}
				}
				break;
			default:
				break;
		}
		return normal_title;
	}
	
	static readonly _____TAGS: unique symbol;

	private get tag(): Tag | null { return (this.s_tags.item as Tag) ?? null; }
	private tag_select_next(next: boolean): boolean { return this.s_tags.find_next_item(next); }

	
	static readonly _____ANCESTRIES: unique symbol;
	
	private ancestry_select_next(next: boolean) {	// for next/previous in details selection banner
		if (get(w_search_state) > T_Search.off) {
			x.si_found.find_next_item(next);
		} else {
			x.si_grabs.find_next_item(next);
		}
		x.ancestry_update_forDetails();
		s_details.redraw();		// force re-render of details
	}	

	static readonly _____TRAIT_THINGS: unique symbol;

	private get traitThing(): Thing | null {
		const item = this.s_trait_things.item;
		if (!!item) {
			return item as Thing;
		}
		return null;
	}
	
	private traitThing_select_next(next: boolean) {
		if (this.s_trait_things.find_next_item(next)) {
			const ancestry = this.traitThing?.ancestry;
			if (!!ancestry) {
				ancestry.grabOnly();	// causes reaction (invoking update())
				x.ancestry_assureIsVisible(ancestry);
			}
		}
	}

	private traitThings_update() {

		////////////////////////////////////////////////////////////////
		//															  //
		//	trait_things				  ALL things that have traits //
		//	w_thing_traits	JUST traits of the current ancestry.thing //
		//															  //
		////////////////////////////////////////////////////////////////

		let thing_traits: Array<Trait> = [];
		if (!!h) {
			this.s_trait_things.items = h.things_unique_havingTraits ?? [];
			const thing = get(w_ancestry_forDetails)?.thing;
			thing_traits = thing?.traits ?? [];
			if (!!thing && thing_traits.length > 0) {
				// compute which index [trait] corresponds to the thing
				const index = this.s_trait_things.items.findIndex(t => t.id == thing.id);
				this.s_trait_things.index = Math.max(0, index);
			}
		}
		w_thing_traits.set(thing_traits);
	}

}

export const s_details = new S_Details();
