import { w_show_results, w_search_result_row, w_results_token } from './Stores';
import { T_Preference, T_Search, T_Startup } from "../common/Global_Imports";
import { c, h, p, Thing, Ancestry } from "../common/Global_Imports";
import { w_search_state, w_search_text } from './Stores';
import { Search_Node } from '../types/Search_Node';
import { w_t_startup } from './Stores';
import { get } from 'svelte/store';

class Search {
	private root_node: Search_Node = new Search_Node();
	results: Array<Thing> = [];

	constructor() {
		setTimeout(() => {
			if (c.allow_Search) {
				w_search_text.set(p.read_key(T_Preference.search_text));
				w_t_startup.subscribe((startup) => {
					if (startup == T_Startup.ready) {
						this.buildIndex(h.things);
						w_search_state.subscribe((state) => {
							if (this.will_search) {
								this.search_for(get(w_search_text).toLocaleLowerCase());
							}
						});
						w_search_text.subscribe((text) => {
							// state machine
							// launch => ignore this
							// click search button => enter
							p.write_key(T_Preference.search_text, text);
							if (this.will_search) {
								this.search_for(text.toLocaleLowerCase());
							}
						});
					}
				});
			}
		}, 1);
	}

	get will_search(): boolean { return [T_Search.enter, T_Search.results].includes(get(w_search_state)); }

	get selected_ancestry(): Ancestry | null {
		const row = get(w_search_result_row);
		if (row === null) return null;
		const thing = this.results[row];
		return thing?.ancestry ?? null;
	}

	search_for(query: string) {
		let state = get(w_search_state);
		if (query.length > 0) {
			this.results = this.root_node.search_for(query);
			state = T_Search.results;
		} else {
			this.results = [];
			state = T_Search.enter;
		}
		w_search_result_row.set(null);	// TODO: only if results are different
		w_search_state.set(state);
		w_show_results.set(this.results.length > 0);
		w_results_token.set(Date.now().toString());
	}
	
	private buildIndex(things: Thing[]) {
		for (const thing of things) {
			const title = thing.title.toLocaleLowerCase();
			const words = title.split(' ');
			for (const word of words) {
				// Insert the full word and all its suffixes
				for (let i = 0; i < word.length; i++) {
					const suffix = word.slice(i);
					this.root_node.insert_wordFor(suffix, thing);
				}
			}
		}
	}

}

export const search = new Search();
