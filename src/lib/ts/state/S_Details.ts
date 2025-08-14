import { w_thing_tags, w_thing_traits, w_data_updated, w_show_details_ofType } from '../managers/Stores';
import { T_Details, T_Direction, T_Storage_Need, S_Identifiables } from '../common/Global_Imports';
import { h, grabs, Thing, Trait, Ancestry } from '../common/Global_Imports';
import { w_ancestry_focus, w_ancestries_grabbed } from '../managers/Stores';
import { S_Banner_Hideable } from './S_Banner_Hideable';

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
		w_show_details_ofType.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
			this.update();
		});
		for (const t_detail of Object.values(T_Details) as T_Details[]) {
			this.s_banner_hideables_byType[t_detail] = new S_Banner_Hideable(t_detail);
		}
	}

	private update() {
		this.update_traitThings();
		this.update_tags();
	}

	update_forBanner(banner_title: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts
		const t_detail = T_Details[banner_title as keyof typeof T_Details];
		switch (t_detail) {
			case T_Details.traits:	  this.selectNext_traitThing(next); break;
			case T_Details.selection: grabs.selectNext_selection(next); break;
			case T_Details.tags:  	  this.selectNext_tag(next); break;
		}
	}
	
	static readonly _____TAGS: unique symbol;

	private get tag_thing(): Thing | null { return (this.s_tag_things.item as Thing) ?? null; }

	private update_tags() {
		this.s_tag_things.set_items(h?.things_unique_havingTags ?? []);
		w_thing_tags.set(grabs.ancestry?.thing?.tags ?? []);
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
			const thing = grabs.ancestry?.thing;
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
