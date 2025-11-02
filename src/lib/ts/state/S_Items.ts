import Identifiable from '../runtime/Identifiable';
import { get, writable } from 'svelte/store';

export default class S_Items<T> {
	w_description = writable<string>('');
	static dummy = new S_Items<any>([]);
    w_item = writable<T | null>(null);
	w_items = writable<Array<T>>([]);
	w_length = writable(0);
	w_index = writable(0);

	//////////////////////////////////////////////
	//											//
	//	manage a list of items, ...				//
	//	  get, set, reset, push, length			//
	//											//
	//	track the current item, ...				//
	//	  get, index (get & set), next			//
	//											//
	//	reactive stores (via x core)...			//
	//	  s elements, details, breadcrumbs,		//
	//	  results (25 files)					//
	//											//
	//	 const { w_item: grab } = x.si_grabs;	//
	//					 ^^^^					//
	//			 reactive store ($grab)			//
	//											//
	//////////////////////////////////////////////
	
	constructor(items: Array<T>) { this.items = items; }

	get index(): number { return get(this.w_index); }
	get length(): number { return get(this.w_length); }
	get items(): Array<T> { return get(this.w_items); }
	get item(): T | null { return this.items[this.index] ?? null; }
	get identifiable(): Identifiable | null { return this.item as unknown as Identifiable ?? null; }
	get descriptionBy_sorted_IDs(): string { return this.items.map(item => (item as unknown as Identifiable)?.id ?? '').sort().join('|'); }
	private set item(item: T | null) { this.w_item.set(item); }
	private set length(l: number) { this.w_length.set(l); }

	reset() {
		this.items = [];
		this.length = 0;
		this.index = 0;		// do this last as it sets description
	}

    set index(i: number) { 
        this.w_index.set(i);
		this.item = this.items[i] ?? null;
		this.w_description.set(`id (@ ${this.index}): ${this.identifiable?.id}   ids (${this.length}): ${this.descriptionBy_sorted_IDs}`);
    }
	
	set items(items: Array<T>) {
		const prior = this.index;
		const length = items.length;
		const index = prior.force_between(0, length - 1);
		this.w_items.set(items);
		this.length = length;
		this.index = index;
	}

	title(many: string, zero: string, one: string): string {
		if (this.length == 0) {
			return zero;
		} else if (this.length == 1) {
			return one;
		} else {
			return this.index.of_n_for_type(this.length, many, '');
		}
	}

	push(item: T) {
		const currentItems = this.items;
		let index = currentItems.indexOf(item);
		if (index == -1) {
			currentItems.push(item);
			this.items = currentItems;
			index = currentItems.length - 1;
		}
		this.index = index;
	}

	find_next_item(next: boolean): boolean {
		let attempts = this.length;
		while (attempts > 0) {
			this.index = this.index.increment(next, this.length);
			if (!!this.item) {
				return true;
			}
			attempts--;
		}
		return false;
	}

	remove(item: T) {
		const index = this.items.indexOf(item);
		if (index != -1) {
			this.items.splice(index, 1);
			this.length -= 1;
			if (this.items.length == 0) {
				this.reset();
			} else if (index < this.index) {
				this.index -= 1;
			}
		}
	}

}
