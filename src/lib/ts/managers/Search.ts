import { p, Tag, Thing, Trait, Persistable, T_Preference } from "../common/Global_Imports";
import { Search_Node } from '../types/Search_Node';
import { w_t_filter, w_t_search } from './Stores';

class Search {
	search_string: string;
	private root: Search_Node = new Search_Node();

	constructor() {
		this.search_string = p.read_key(T_Preference.search_text);
	}

	search_for(query: string) {
		this.search_string = query;
		p.write_key(T_Preference.search_text, query);
		const lowerQuery = query.toLowerCase();
		let current = this.root;

		// Walk down the trie following the query
		for (const char of lowerQuery) {
			const child = current.children.get(char);
			if (!child) return []; // No matches
			current = child;
		}

		// Return all items at this node
		return Array.from(current.items);
	}
	
	buildIndex(items: Thing[]) {		// Build the index
		for (const item of items) {
			const title = item.title.toLowerCase();
			// Index every possible starting position
			for (let i = 0; i < title.length; i++) {
				this.insertSuffix(title.substring(i), item);
			}
		}
	}
	
	private insertSuffix(suffix: string, item: Thing): void {
		let current = this.root;
		// Walk down the tree, creating nodes as needed
		for (const char of suffix) {
			if (!current.children.has(char)) {
				current.children.set(char, new Search_Node());
			}
			current = current.children.get(char)!;
			current.items.add(item);
		}
		current.isEndOfWord = true;
	}

}

export const search = new Search();
