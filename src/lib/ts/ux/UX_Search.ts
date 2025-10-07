import { T_Search, T_Startup, T_Preference } from "../common/Global_Imports";
import { w_search_results_found, w_search_results_changed } from '../managers/Stores';
import { c, k, h, p, x, Thing, Ancestry } from "../common/Global_Imports";
import { w_search_state, w_search_show_controls } from '../managers/Stores';
import { Search_Node } from '../types/Search_Node';
import { w_t_startup } from '../managers/Stores';
import { get } from 'svelte/store';

class UX_Search {
	search_text: string | null = null;
	private root_node: Search_Node = new Search_Node();

	get selected_row(): number | null { return x.si_found.index; }

	activate() {
		w_search_state.set(T_Search.enter);
		w_search_show_controls.set(true);
	}

	deactivate() {
		w_search_results_found.set(0);
		w_search_state.set(T_Search.off);
		w_search_show_controls.set(false);
	}

	set selected_row(row: number) {
		x.si_found.index = row;
		w_search_state.set(T_Search.selected);
		x.ancestry_update_forDetails();
	}

	get selected_ancestry(): Ancestry | null {
		const row = this.selected_row;
		if (row !== null && !!get(w_search_show_controls)) {
			const thing = x.si_found.items[row];
			return thing?.ancestry ?? null;
		}
		return null;
	}

	next_row(up: boolean) {
		const row = this.selected_row;
		if (row !== null) {
			const count = x.si_found.items.length;	// stupid, but it works
			this.selected_row = row.increment(up, count);
			// also make sure the row is visible
		}
	}

	update_search_for(query: string) {
		this.search_text = query;
		if (query.length > 0) {
			x.si_found.items = this.root_node.search_for(query);
		} else {
			x.si_found.reset();
		}
	}

	deactivate_focus_and_grab() {
		const ancestry = this.selected_ancestry;
		this.deactivate();
		if (!!ancestry) {
			ancestry.becomeFocus();
			ancestry.grab();
		}
	}

	search_for(query: string) {
		this.search_text = query;
		const before = this.results_fingerprint;
		if (query.length > 0) {
			x.si_found.items = this.root_node.search_for(query);
			const show_results = x.si_found.items.length > 0;
			w_search_results_found.set(x.si_found.items.length);
			w_search_state.set(show_results ? T_Search.results : T_Search.enter);
		} else {
			x.si_found.reset();
			w_search_results_found.set(0);
			w_search_state.set(T_Search.enter);
		}
		if (before !== this.results_fingerprint) {	// only if results are different
			x.si_found.index = -1;
		}
		w_search_show_controls.set(T_Search.off != get(w_search_state));
		w_search_results_changed.set(Date.now());
	}

	constructor() {
		setTimeout(() => {
			if (c.allow_search) {
				this.search_text = p.read_key(T_Preference.search_text);
				w_t_startup.subscribe((startup) => {
					if (startup == T_Startup.ready) {
						this.buildIndex(h.things);
						w_search_results_changed.set(Date.now());
						w_search_state.subscribe((state) => {
							const text = this.search_text?.toLowerCase();
							if (!!text) {
								if (state === T_Search.rebuild_index) {
									this.buildIndex(h.things);
									this.update_search_for(text);
								} else if (state !== T_Search.off ) {
									this.search_for(text);
								}
							}
						});
					}
				});
			}
		}, 1);
	}
	
	static readonly _____PRIVATE: unique symbol;

	private get results_fingerprint(): string { return !x.si_found.items ? k.empty : x.si_found.items.map(result => result.id).join('|'); }

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

export const search = new UX_Search();
