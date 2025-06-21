export default class S_Identifiables<T> {

	// for browsing through traits & tags and recents

	items: Array<T> = [];
	index_ofItem = 0;

	set_items(items: Array<T>) { this.items = items; }
	constructor(items: Array<T>) { this.set_items(items); }
	get item(): T | null { return this.items[this.index_ofItem] ?? null; }

	push(item: T) {
		let index = this.items.indexOf(item);
		if (index == -1) {
			this.items.push(item);
			index = this.items.length - 1;
		}
		this.index_ofItem = index;
	}

	find_next_item(next: boolean): boolean {
		let index = this.items.length;
		while (index > 0) {		// prevent infinite loop if no item is found
			this.index_ofItem = this.index_ofItem.increment(next, this.items.length);
			if (!!this.item) {
				return true;
			}
			index--;
		}
		return false;
	}
}