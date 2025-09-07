import { h, p, Thing, T_Preference, T_Search, T_Startup } from "../common/Global_Imports";
import { w_search_text, w_search_filter, w_search_state, w_t_startup, w_t_database } from './Stores';
import { Search_Node } from '../types/Search_Node';
import { w_results_token } from './Stores';

class Search {
	private root_ofIndex: Search_Node = new Search_Node();
	results: Array<Thing> = [];

	constructor() {
		w_search_text.set(p.read_key(T_Preference.search_text));
		w_t_startup.subscribe((startup) => {
			if (startup == T_Startup.ready) {
				this.buildIndex(h.things);
				w_search_text.subscribe((text) => {
					p.write_key(T_Preference.search_text, text);
					this.search_for(text.toLocaleLowerCase());
				});
			}
		});
	}

	search_for(query: string) {
		if (query.length > 0) {
			this.results = this.root_ofIndex.search_for(query);
			w_search_state.set(T_Search.results);
			w_results_token.set(Date.now().toString());
		} else {
			this.results = [];
			w_search_state.set(T_Search.enter);
		}
	}
	
	private buildIndex(things: Thing[]) {
		for (const thing of things) {
			const title = thing.title.toLocaleLowerCase();
			const words = title.split(' ');
			for (const word of words) {
				this.root_ofIndex.insert_wordFor(word, thing);
			}
		}
	}

}

export const search = new Search();
