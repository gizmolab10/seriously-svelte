import { T_Detail, T_Direction, T_Storage_Need, S_Identifiables } from '../common/Global_Imports';
import { w_thing_tags, w_thing_traits, w_ancestry_focus } from '../managers/Stores';
import { w_search_result_row, w_search_results_found } from '../managers/Stores';
import { h, grabs, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { w_data_updated, w_show_details_ofType } from '../managers/Stores';
import { w_ancestries_grabbed } from '../managers/Stores';
import { S_Banner_Hideable } from './S_Banner_Hideable';
import { get } from 'svelte/store';

class S_Details {
	private s_banner_hideables_byType: { [t_detail: string]: S_Banner_Hideable } = {};
	private s_trait_things = new S_Identifiables<Thing>([]);
	private s_tag_things = new S_Identifiables<Thing>([]);
	t_storage_need = T_Storage_Need.direction;
	show_properties = false;
	number_ofDetails = 0;

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
			this.number_ofDetails = t_details?.length ?? 0;
			this.update();
		});
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			this.s_banner_hideables_byType[t_detail] = new S_Banner_Hideable(t_detail);
		}
	}

	private update() {
		this.update_traitThings();
		this.update_tags();
	}
	
	static readonly _____BANNERS: unique symbol;

	update_forBanner(banner_title: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts
		const t_detail = T_Detail[banner_title as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	  this.selectNext_traitThing(next); break;
			case T_Detail.tags:  	  this.selectNext_tag(next); break;
			case T_Detail.selection: grabs.grab_next(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const normal_title = T_Detail[t_detail];
		switch (t_detail) {	
			case T_Detail.selection:
				const row = get(w_search_result_row);
				const grabbed = get(w_ancestries_grabbed);
				const matches = get(w_search_results_found);
				if (row != null && !!matches && matches > 1) {
					return row.of_n_for_type(matches, 'match', 'es');
				} else if (!!grabbed && grabbed.length > 1) {
					return grabs.index_ofAncestry.of_n_for_type(grabbed.length, 'grabbed', '');
				}
				break;
			default:
				break;
		}
		return normal_title;
	}
	
	static readonly _____TAGS: unique symbol;

	private get tag_thing(): Thing | null { return (this.s_tag_things.item as Thing) ?? null; }

	private update_tags() {
		this.s_tag_things.set_items(h?.things_unique_havingTags ?? []);
		w_thing_tags.set(grabs.ancestry_forInformation?.thing?.tags ?? []);
	}
	
	selectNext_tag(next: boolean) {
		if (this.s_tag_things.find_next_item(next)) {
			const ancestry = this.tag_thing?.ancestry;
			if (!!ancestry) {
				ancestry.grabOnly();
				grabs.latest_assureIsVisible();
			}
		}
	}

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
			this.s_trait_things.set_items(h.things_unique_havingTraits ?? []);
			const thing = grabs.ancestry_forInformation?.thing;
			thing_traits = thing?.traits ?? [];
			if (!!thing && thing_traits.length > 0) {
				// compute which index [trait] corresponds to the thing
				const index = this.s_trait_things.items.findIndex(t => t.id == thing.id);
				this.s_trait_things.index_ofItem = Math.max(0, index);
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
