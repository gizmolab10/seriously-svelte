import { w_t_database, w_ancestry_focus, w_ancestries_grabbed, w_hierarchy } from '../common/Stores';
import { w_tag_things, w_thing_tags, w_thing_traits, w_tag_thing_index } from '../common/Stores';
import { h, Tag, grabs, Trait, Thing, Ancestry } from '../common/Global_Imports';
import { w_show_details_ofType, w_show_traits_ofType } from '../common/Stores';
import { T_Trait, T_Details, T_Direction, k } from '../common/Global_Imports';
import { S_Identifiables } from './S_Identifiables';
import { get } from 'svelte/store';

class S_Details {
	private s_things = new S_Identifiables<Thing>([]);
	private s_traits = new S_Identifiables<Trait>([]);
	private s_tags = new S_Identifiables<Tag>([]);
	font_size = k.font_size.smaller;
	number_ofDetails = 0;

	constructor() {
		this.update();
		w_t_database.subscribe((type: string) => {
			this.update();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update();
		});
		w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
			this.update();
		});
		w_show_traits_ofType.subscribe((t_traits: Array<T_Trait>) => {
			this.update();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
		});
	}

	private update() {
		this.update_things();
		this.update_traits();
		this.update_tags();
	}

	update_forBanner(banner_title: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;
		const t_details = T_Details[banner_title as keyof typeof T_Details];
		switch (t_details) {
			case T_Details.traits: this.select_nextTrait(next); break;
			case T_Details.tags:   this.select_nextTag(next); break;
		}
	}
	
	static readonly _____TRAITS: unique symbol;

	private get trait(): Trait | null { return (this.s_traits.item as Trait) ?? null; }

	private update_s_traits() {
		const t_traits = get(w_show_traits_ofType);
		if (!!h && !!t_traits) {
			const traits = (t_traits.length > 1 ? h.traits : h.traits_forType(t_traits[0] as T_Trait)) ?? [];
			this.s_traits.set_items(traits);
		}
	}

	private update_traits() {
		// when grab changes, traits must also change
		// also, which trait [index] corresponds to the grab
		this.update_s_traits();
		const thing = grabs.latest_thing;
		const thing_traits = thing?.traits ?? [];
		if (!thing || thing_traits.length == 0) {
			w_thing_traits.set([]);
		} else {
			const index = this.s_traits.items.findIndex(t => t.ownerID == thing.id);
			this.s_traits.index_ofItem = Math.max(0, index);
			w_thing_traits.set(thing_traits);
		}
	}
	
	select_nextTrait(next: boolean) {
		if (!!h && this.s_traits.find_next_item(next)) {
			this.trait?.owner?.ancestry?.grabOnly();	// causes reaction (invoking update())
			grabs.latest_assureIsVisible();
			w_hierarchy.set(h);
		}
	}
	
	static readonly _____THINGS: unique symbol;

	private get thing(): Thing | null { return (this.s_things.item as Thing) ?? null; }

	private update_things() {
		const things = this.tag?.things ?? [];
		const ancestry = grabs.latest;
		this.s_things.items = things;
		this.s_things.total_items = things.length;
		const index = Math.max(0, things.findIndex(t => t.hid == ancestry?.thing?.hid));
		this.s_things.index_ofItem = index;
		w_tag_thing_index.set(index);
		w_tag_things.set(things);
	}
	
	select_nextThing(next: boolean) {
		if (!!h && this.s_things.find_next_item(next)) {	// alters thing, and index_ofItem, both are used below
			this.thing?.ancestry?.grabOnly();		// causes reaction (invoking update())
			grabs.latest_assureIsVisible();
			w_hierarchy.set(h);
		}
	}

	static readonly _____TAGS: unique symbol;

	private get tag(): Tag | null { return (this.s_tags.item as Tag) ?? null; }

	private update_s_tags() {
		if (!!h) {
			const tags = h?.tags ?? [];
			this.s_tags.items = tags;
			this.s_tags.total_items = tags.length;
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
	
	select_nextTag(next: boolean) {
		if (this.s_tags.find_next_item(next)) {
			this.update();
			const ancestry = this.thing?.ancestry;
			if (!!h && !!ancestry) {
				ancestry.grabOnly();
				grabs.latest_assureIsVisible();
				this.s_things.index_ofItem = 0;
				w_hierarchy.set(h);
			}
		}
	}

}

export const s_details = new S_Details();
