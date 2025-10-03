import { get, writable } from 'svelte/store';

export default class S_Identifiables<T> {
	w_items = writable<Array<T>>([]);
	w_index = writable(0);
	
	constructor(items: Array<T>) { this.items = items; }

	set index(i: number) { this.w_index.set(i); }
	get index(): number { return get(this.w_index); }
	get items(): Array<T> { return get(this.w_items); }
	get item(): T | null { return get(this.w_items)[this.index] ?? null; }
	
	set items(items: Array<T>) {
		this.w_items.set(items);
		const prior = this.index;
		const length = items.length;
		this.w_index.set(prior.force_between(0, length - 1));
	}

	push(item: T) {
		const currentItems = this.items;
		let index = currentItems.indexOf(item);
		if (index == -1) {
			this.w_items.update(arr => [...arr, item]);
			index = currentItems.length;
		}
		this.w_index.set(index);
	}

	find_next_item(next: boolean): boolean {
		let attempts = this.items.length;
		while (attempts > 0) {
			this.index = this.index.increment(next, this.items.length);
			if (!!this.item) {
				console.log('found item', this.index);
				return true;
			}
			attempts--;
		}
		return false;
	}
}