import { show, Ancestry, T_Details, Tag, Trait, T_Trait, Thing } from '../common/Global_Imports';
import { w_hierarchy, w_t_database, w_ancestries_grabbed } from '../common/Stores';
import { w_thing_traits, w_thing_tags, w_ancestry_focus } from '../common/Stores';
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
		this.index_ofItem = 0;
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
	ancestry: Ancestry = get(w_hierarchy)?.rootAncestry;
	private s_things = new S_Identifiables<Thing>([]);
	private s_traits = new S_Identifiables<Trait>([]);
	private s_tags = new S_Identifiables<Tag>([]);
	number_ofDetails = 0;

	constructor() {
		w_t_database.subscribe((db: string) => {
			this.update();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update();
		});
		w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
			this.update();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
		});
	}

	private update() {
		this.update_forKind_ofInfo();
		this.update_traits();
		this.update_tags();
		this.update_things();
	}

	private get hasGrabs(): boolean {
		const grabs = get(w_ancestries_grabbed);
		if (!grabs || grabs.length === 0) { return false; }
		return !(get(w_ancestry_focus)?.isGrabbed ?? true);
	}

	update_forKind_ofInfo() {
		if (show.shows_focus || !this.hasGrabs) {
			this.ancestry = get(w_ancestry_focus);
		} else {
			const grabs = get(w_ancestries_grabbed);
			if (!!grabs && grabs.length > 0) {
				this.ancestry = grabs[0];
			}
		}
	}
	
	static readonly _____TRAITS: unique symbol;

	private get trait(): Trait | null { return (this.s_traits.item as Trait) ?? null; }

	private update_hierarchy_traits() {
		const h = get(w_hierarchy);
		const titles = get(w_show_traits_ofType);
		if (!!h && !!titles) {
			const traits = (titles.length > 1 ? h.traits : h.traits_forType(titles[0] as T_Trait)) ?? [];
			this.s_traits.set_items(traits);
		}
	}

	private update_traits() {
		this.update_hierarchy_traits();
		const thing = this.ancestry?.thing ?? null;
		const thing_traits = thing?.traits ?? [];
		if (!!thing && !!thing_traits && thing_traits.length > 0) {
			const index = this.s_traits.items.findIndex(t => t.ownerID == thing.id);
			this.s_traits.index_ofItem = Math.max(0, index);
			w_thing_traits.set(thing_traits);
		}
	}
	
	select_nextTrait(next: boolean) {
		if (this.s_traits.find_next_item(next)) {
			const h = get(w_hierarchy);
			this.trait?.owner?.ancestry?.grabOnly();
			h.grabs_latest_assureIsVisible();
			w_hierarchy.set(h);
		}
	}
	
	static readonly _____THINGS: unique symbol;

	private get thing(): Thing | null { return (this.s_things.item as Thing) ?? null; }

	private update_things() {
		const h = get(w_hierarchy);
		const things = this.tag?.things ?? [];
		this.s_things.items = things;
		this.s_things.total_items = things.length;
		this.s_things.index_ofItem = 0;
	}
	
	select_nextThing(next: boolean) {
		if (this.s_things.find_next_item(next)) {
			const h = get(w_hierarchy);
			this.thing?.ancestry?.grabOnly();
			h.grabs_latest_assureIsVisible();
			w_hierarchy.set(h);
		}
	}

	static readonly _____TAGS: unique symbol;

	private get tag(): Tag | null { return (this.s_tags.item as Tag) ?? null; }

	private update_hierarchy_tags() {
		const tags = get(w_hierarchy)?.tags ?? [];
		this.s_tags.items = tags;
		this.s_tags.total_items = tags.length;
	}

	private update_tags() {
		this.update_hierarchy_tags();
		const thing = this.ancestry?.thing ?? null;
		const thing_tags = thing?.tags ?? [];
		if (!!thing && !!thing_tags && thing_tags.length > 0) {
			const index = this.s_tags.items.findIndex(t => t.thingHIDs.includes(thing.hid));
			this.s_tags.index_ofItem = Math.max(0, index);
			w_thing_tags.set(thing_tags);
		}
	}
	
	select_nextTag(next: boolean) {
		if (this.s_tags.find_next_item(next)) {
			const ancestry = this.tag?.ownerAt(0)?.ancestry;
			if (!!ancestry) {
				const h = get(w_hierarchy);
				ancestry.grabOnly();
				h.grabs_latest_assureIsVisible();
				w_hierarchy.set(h);
				this.update_things();
			}
		}
	}

}

export const s_details = new S_Details();