import { w_show_results, w_search_result_row, w_results_token } from './Stores';
import { T_Preference, T_Search, T_Startup } from "../common/Global_Imports";
import { w_search_state, w_search_text, w_search_isActive } from './Stores';
import { c, k, h, p, Thing, Ancestry } from "../common/Global_Imports";
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
							const text = get(w_search_text);
							if (this.isActive && !!text) {
								this.search_for(text.toLowerCase());
							}
							w_search_isActive.set(this.isActive);
						});
						w_search_text.subscribe((text) => {
							// state machine
							// launch => ignore this
							// click search button => enter
							if (!!text) {
								p.write_key(T_Preference.search_text, text);
								if (this.isActive) {
									this.search_for(text.toLowerCase());
								}
								w_search_isActive.set(this.isActive);
							}
						});
					}
				});
			}
		}, 1);
	}

	activate() { w_search_state.set(T_Search.enter); }

	deactivate() {
		w_show_results.set(false);
		w_search_result_row.set(null);
		w_search_state.set(T_Search.off);
	}

	get selected_ancestry(): Ancestry | null {
		const row = get(w_search_result_row);
		if (row === null) return null;
		const thing = this.results[row];
		return thing?.ancestry ?? null;
	}

	static readonly _____PRIVATE: unique symbol;

	private get isActive(): boolean { return [T_Search.enter, T_Search.results].includes(get(w_search_state)); }
	private get results_fingerprint(): string { return !this.results ? k.empty : this.results.map(result => result.id).join('|'); }

	private search_for(query: string) {
		let state = get(w_search_state);
		const before = this.results_fingerprint;
		if (query.length > 0) {
			this.results = this.root_node.search_for(query);
			state = T_Search.results;
		} else {
			this.results = [];
			state = T_Search.enter;
		}
		w_search_state.set(state);
		w_show_results.set(this.results.length > 0);
		w_results_token.set(Date.now().toString());
		if (before !== this.results_fingerprint) {	// only if results are different
			w_search_result_row.set(null);
		}
	}
	
	private buildIndex(things: Thing[]) {
		for (const thing of things) {
			const title = thing.title.toLowerCase();
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
