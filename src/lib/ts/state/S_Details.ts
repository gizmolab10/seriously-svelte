import { h, grabs, Ancestry, T_Details, Tag, Trait, T_Trait, Thing } from '../common/Global_Imports';
import { w_t_database, w_ancestry_focus, w_ancestries_grabbed, w_hierarchy } from '../common/Stores';
import { w_tag_things, w_thing_tags, w_thing_traits, w_tag_thing_index } from '../common/Stores';
import { w_show_details_ofType, w_show_traits_ofType } from '../common/Stores';
import { get } from 'svelte/store';

class S_Identifiables<T> {
	items: Array<T> = [];
	index_ofItem = 0;
	total_items = 0;

	constructor(items: Array<T>) { this.set_items(items); }
	get item(): T | null { return this.items[this.index_ofItem] ?? null; }

	set_items(items: Array<T>) {
		this.items = items;
		this.total_items = items.length;
	}

	find_next_item(next: boolean): boolean {
		let index = this.items.length;
		while (index > 0) {		// prevent infinite loop if no item is found
			this.index_ofItem = this.index_ofItem.increment(next, this.total_items);
			if (!!this.item) {
				return true;
			}
			index--;
		}
		return false;
	}
}

class S_Details {
	private s_things = new S_Identifiables<Thing>([]);
	private s_traits = new S_Identifiables<Trait>([]);
	private s_tags = new S_Identifiables<Tag>([]);
	number_ofDetails = 0;

	constructor() {
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
		this.update();
	}

	private update() {
		grabs.update_forKind_ofInfo();
		this.update_things();
		this.update_traits();
		this.update_tags();
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
		const thing = grabs.ancestry_forInfo?.thing ?? null;
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
		const ancestry = grabs.ancestry_forInfo;
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
		const thing = grabs.ancestry_forInfo?.thing ?? null;
		const thing_tags = thing?.tags ?? [];
		if (!thing || thing_tags.length == 0) {
			w_thing_tags.set([]);
		} else {
			const index = Math.max(0, this.s_tags.items.findIndex(t => t.thingHIDs.includes(thing.hid)));
			this.s_tags.index_ofItem = index;
			w_thing_tags.set(thing_tags);
		}
	}
	
	select_nextTag(next: boolean) {
		if (this.s_tags.find_next_item(next)) {
			const ancestry = this.tag?.ownerAt(0)?.ancestry;
			if (!!h && !!ancestry) {
				ancestry.grabOnly();
				grabs.latest_assureIsVisible();
				w_hierarchy.set(h);
			}
		}
	}

}

export const s_details = new S_Details();