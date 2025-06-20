import { w_thing_traits, w_storage_updated, w_show_details_ofType } from '../common/Stores';
import { T_Details, T_Direction, S_Identifiables } from '../common/Global_Imports';
import { w_tag_things, w_thing_tags, w_tag_thing_index } from '../common/Stores';
import { h, Tag, grabs, Thing, Ancestry } from '../common/Global_Imports';
import { w_ancestry_focus, w_ancestries_grabbed } from '../common/Stores';
import { S_Hideable } from './S_Hideable';

class S_Details {
	private s_hideables_byType: { [t_detail: string]: S_Hideable } = {};
	private s_trait_things = new S_Identifiables<Thing>([]);
	private s_things = new S_Identifiables<Thing>([]);
	private s_tags = new S_Identifiables<Tag>([]);
	number_ofDetails = 0;

	constructor() {
		w_storage_updated.subscribe((count: number) => {
			this.setup();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update();
		});
		w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
			this.update();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
			this.update();
		});
		for (const t_detail of Object.values(T_Details) as T_Details[]) {
			this.s_hideables_byType[t_detail] = new S_Hideable(t_detail);
		}
	}

	private setup() {
		if (!!h) {
			this.s_trait_things.set_items(h.things_unique_havingTraits());
			this.s_tags.set_items(h.tags);
			this.update();
		}
	}

	private update() {
		this.update_things();
		this.update_traitThings();
		this.update_tags();
	}

	update_forBanner(banner_title: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts
		const t_detail = T_Details[banner_title as keyof typeof T_Details];
		switch (t_detail) {
			case T_Details.traits: this.selectNext_traitThing(next); break;
			case T_Details.tags:   this.selectNext_tag(next); break;
		}
	}
	
	static readonly _____TRAITS: unique symbol;

	private get traitThing(): Thing | null { return (this.s_trait_things.item as Thing) ?? null; }

	private update_traitThings() {
		// when grab changes, must also change
		// which trait [index] corresponds to the grab
		const thing = grabs.latest_thing;
		const thing_traits = thing?.traits ?? [];
		if (!thing || thing_traits.length == 0) {
			w_thing_traits.set([]);
		} else {
			const index = this.s_trait_things.items.findIndex(t => t.id == thing.id);
			this.s_trait_things.index_ofItem = Math.max(0, index);
			w_thing_traits.set(thing_traits);
		}
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
	
	static readonly _____THINGS: unique symbol;

	private get thing(): Thing | null { return (this.s_things.item as Thing) ?? null; }

	private update_things() {
		const things = this.tag?.things ?? [];
		const ancestry = grabs.latest;
		this.s_things.set_items(things);
		const index = Math.max(0, things.findIndex(t => t.hid == ancestry?.thing?.hid));
		this.s_things.index_ofItem = index;
		w_tag_thing_index.set(index);
		w_tag_things.set(things);
	}
	
	selectNext_thing(next: boolean) {
		if (this.s_things.find_next_item(next)) {	// alters thing, and index_ofItem, both are used below
			this.thing?.ancestry?.grabOnly();		// causes reaction (invoking update())
			grabs.latest_assureIsVisible();
		}
	}

	static readonly _____TAGS: unique symbol;

	private get tag(): Tag | null { return (this.s_tags.item as Tag) ?? null; }

	private update_s_tags() {
		if (!!h) {
			const tags = h?.tags ?? [];
			this.s_tags.set_items(tags);
		}
	}

	private update_tags() {
		this.update_s_tags();
		const thing = grabs.latest_thing;
		const thing_tags = thing?.tags ?? [];
		if (!thing || thing_tags.length == 0) {
			w_thing_tags.set([]);
		} else {
			const next_index = this.s_tags.items.findIndex(t => t.thingHIDs.includes(thing.hid));
			const index = Math.max(0, next_index);
			this.s_tags.index_ofItem = index;
			w_thing_tags.set(thing_tags);
		}
	}
	
	selectNext_tag(next: boolean) {
		if (this.s_tags.find_next_item(next)) {
			this.update();
			const ancestry = this.thing?.ancestry;
			if (!!ancestry) {
				ancestry.grabOnly();
				grabs.latest_assureIsVisible();
				this.s_things.index_ofItem = 0;
			}
		}
	}

}

export const s_details = new S_Details();
