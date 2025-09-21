import { w_search_results_found, w_search_result_row, w_search_results_changed } from './Stores';
import { T_Preference, T_Search, T_Startup } from "../common/Global_Imports";
import { c, k, h, p, Thing, Ancestry } from "../common/Global_Imports";
import { w_search_state, w_show_search_controls } from './Stores';
import { Search_Node } from '../types/Search_Node';
import { w_t_startup } from './Stores';
import { get } from 'svelte/store';

class Search {
	private root_node: Search_Node = new Search_Node();
	search_text: string | null = null;
	results: Array<Thing> = [];

	activate() { w_search_state.set(T_Search.enter); w_show_search_controls.set(true); }
	get selected_row(): number | null { return get(w_search_result_row); }

	deactivate() {
		w_search_results_found.set(0);
		w_search_state.set(T_Search.off);
		w_show_search_controls.set(false);
	}

	set_result_row(row: number) {
		w_search_result_row.set(row);
		w_search_state.set(T_Search.selected);
		w_show_search_controls.set(false);
	}

	get result_ancestry(): Ancestry | null {
		const row = this.selected_row;
		if (row === null) return null;
		const thing = this.results[row];
		return thing?.ancestry ?? null;
	}

	next_row(up: boolean) {
		const row = this.selected_row;
		if (row !== null) {
			const count = this.results.length;	// stupid, but it works
			this.set_result_row(row.increment(up, count));
		}
	}

	search_for(query: string) {
		this.search_text = query;
		const before = this.results_fingerprint;
		if (query.length > 0) {
			this.results = this.root_node.search_for(query);
			const show_results = this.results.length > 0;
			w_search_results_found.set(this.results.length);
			w_search_state.set(show_results ? T_Search.results : T_Search.enter);
		} else {
			this.results = [];
			w_search_results_found.set(0);
			w_search_state.set(T_Search.enter);
		}
		if (before !== this.results_fingerprint) {	// only if results are different
			w_search_result_row.set(null);
		}
		w_show_search_controls.set([T_Search.enter, T_Search.results].includes(get(w_search_state)));
		w_search_results_changed.set(Date.now());
	}

	constructor() {
		setTimeout(() => {
			if (c.allow_Search) {
				this.search_text = p.read_key(T_Preference.search_text);
				w_t_startup.subscribe((startup) => {
					if (startup == T_Startup.ready) {
						this.buildIndex(h.things);
						w_search_results_changed.set(Date.now());
						w_search_state.subscribe((state) => {
							const text = this.search_text;
							if (state !== T_Search.off && !!text) {
								this.search_for(text.toLowerCase());
							}
						});
					}
				});
			}
		}, 1);
	}
	
	static readonly _____PRIVATE: unique symbol;

	private get results_fingerprint(): string { return !this.results ? k.empty : this.results.map(result => result.id).join('|'); }

	private buildIndex(things: Thing[]) {
		this.root_node = new Search_Node();
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
