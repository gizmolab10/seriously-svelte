export class S_Identifiables<T> {

	// for browsing through traits & tags

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