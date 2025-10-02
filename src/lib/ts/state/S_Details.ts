import { T_Detail, T_Startup, T_Direction, S_Identifiables } from '../common/Global_Imports';
import { w_t_startup, w_count_details, w_show_details_ofType } from '../managers/Stores';
import { w_thing_traits, w_ancestry_focus, w_data_updated } from '../managers/Stores';
import { h, Tag, Thing, Trait, grabs, Ancestry } from '../common/Global_Imports';
import { w_search_result_row, w_search_results_found } from '../managers/Stores';
import { S_Banner_Hideable } from './S_Banner_Hideable';
import { get, Writable } from 'svelte/store';

class S_Details {
	private s_banner_hideables_byType: { [t_detail: string]: S_Banner_Hideable } = {};
	private s_trait_things = new S_Identifiables<Thing>([]);
	private grabbed_ancestries!: Writable<Array<Ancestry>>;
	private s_tags = new S_Identifiables<Tag>([]);
	show_properties = false;

	constructor() {
		w_data_updated.subscribe((count: number) => {
			this.update();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update();
		});
		w_search_result_row.subscribe((row: number | null) => {
			this.update();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Detail>) => {
			this.update();
		});
		w_t_startup.subscribe((startup: number | null) => {
			this.update();
		});
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			this.s_banner_hideables_byType[t_detail] = new S_Banner_Hideable(t_detail);
		}
	}

	private update() {
		if (get(w_t_startup) == T_Startup.ready) {
			this.update_traitThings();
			this.grabbed_ancestries = grabs.s_grabbed_ancestries.w_items;
			this.s_tags.items = grabs.ancestry_forInformation?.thing?.tags ?? [];
		}
	}

	redraw() { w_count_details.update(n => n + 1); }	// force re-render of details
	
	static readonly _____BANNERS: unique symbol;

	update_forBanner(banner_id: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts
		const t_detail = T_Detail[banner_id as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	 this.selectNext_traitThing(next); break;
			case T_Detail.tags:  	 this.selectNext_tag(next); break;
			case T_Detail.selection: grabs.grab_next(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const normal_title = T_Detail[t_detail];
		switch (t_detail) {	
			case T_Detail.selection:
				const row	  = get(w_search_result_row);
				const matches = get(w_search_results_found);
				const grabbed = get(this.grabbed_ancestries);
				if (row != null && !!matches && matches > 1) {
					console.log('search result', row);
					return row.of_n_for_type(matches, 'search result', '');
				} else if (!!grabbed) {
					switch (grabbed.length) {
						case 1:  break;
						case 0:  return 'focus';
						default: return grabs.index_ofAncestry.of_n_for_type(grabbed.length, 'selected', '');
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
	selectNext_tag(next: boolean): boolean { return this.s_tags.find_next_item(next); }
	
	static readonly _____TRAITS: unique symbol;

	private get traitThing(): Thing | null {
		const item = this.s_trait_things.item;
		if (!!item) {
			return item as Thing;
		}
		return null;
	}

	private update_traitThings() {

		////////////////////////////////////////////////////////////////
		//															  //
		//	trait_things				  ALL things that have traits //
		//	w_thing_traits	JUST traits of the current ancestry.thing //
		//															  //
		////////////////////////////////////////////////////////////////

		let thing_traits: Array<Trait> = [];
		if (!!h) {
			this.s_trait_things.items = h.things_unique_havingTraits ?? [];
			const thing = grabs.ancestry_forInformation?.thing;
			thing_traits = thing?.traits ?? [];
			if (!!thing && thing_traits.length > 0) {
				// compute which index [trait] corresponds to the thing
				const index = this.s_trait_things.items.findIndex(t => t.id == thing.id);
				this.s_trait_things.index = Math.max(0, index);
			}
		}
		w_thing_traits.set(thing_traits);
	}
	
	selectNext_traitThing(next: boolean) {
		if (this.s_trait_things.find_next_item(next)) {
			const ancestry = this.traitThing?.ancestry;
			if (!!ancestry) {
				ancestry.grabOnly();	// causes reaction (invoking update())
				grabs.latest_assureIsVisible();
			}
		}
	}

}

export const s_details = new S_Details();
