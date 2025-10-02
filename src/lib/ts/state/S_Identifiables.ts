import { get, writable } from 'svelte/store';

export default class S_Identifiables<T> {

	// for browsing through traits & tags and recents

	items: Array<T> = [];
	index = writable(0);

	set index_ofItem(i: number) { this.index.set(i); }
	get index_ofItem(): number { return get(this.index); }
	get item(): T | null { return this.items[this.index_ofItem] ?? null; }
	constructor(items: Array<T>) { this.set_items(items); }

	set_items(items: Array<T>) {
		this.items = items;
		const i = this.index_ofItem;
		const length = this.items.length;
		this.index.set(i.force_between(0, length - 1));
	}

	push(item: T) {
		let i = this.items.indexOf(item);
		if (i == -1) {
			this.items.push(item);
			i = this.items.length - 1;
		}
		this.index.set(i);
	}

	find_next_item(next: boolean): boolean {
		let i = this.items.length;
		while (i > 0) {		// prevent infinite loop if no item is found
			this.index.set(this.index_ofItem.increment(next, this.items.length));
			if (!!this.item) {
				console.log('found item', this.index_ofItem);
				return true;
			}
			i--;
		}
		return false;
	}
}