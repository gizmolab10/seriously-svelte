import { w_t_startup, w_search_state, w_ancestry_forDetails, w_ancestry_focus, w_show_details_ofType } from './Stores';
import { T_Search, T_Startup, S_Identifiables, T_Detail } from '../common/Global_Imports';
import { grabs, search, Thing, Ancestry } from '../common/Global_Imports';
import type { Identifiable_Pair } from '../types/Types';
import { get } from 'svelte/store';

export default class X_Identifiables {

	//////////////////////////
	//						//
	//	manage				//
	//	  grab, expand,		//
	//	  recent, search,	//
	//	  details			//
	//						//
	//////////////////////////

	constructor() {
		w_t_startup.subscribe((startup: number | null) => {
			if (startup == T_Startup.ready) {
				this.update_forSearch();
				w_search_state.subscribe((row: number | null) => {
					this.update_forSearch();
						});
				w_ancestry_focus.subscribe((ancestry: Ancestry) => {
					this.update_ancestry_forDetails();
				});
			}
		});
	}

	si_recents = new S_Identifiables<Identifiable_Pair>([]);
	si_expanded = new S_Identifiables<Ancestry>([]);
	si_grabs = new S_Identifiables<Ancestry>([]);
	si_found = new S_Identifiables<Thing>([]);

	private update_forSearch() {
		if (get(w_search_state) != T_Search.off) {
			const items = this.si_found.items.map(result => result.ancestry) ?? [];
			if (this.si_grabs.items.map(a => a.id).join(',') != items.map(a => a.id).join(',')) {
				this.si_grabs.items = items;
			}
		}
	}

	update_ancestry_forDetails() {
		const presented = get(w_ancestry_forDetails);
		let ancestry = search.selected_ancestry;
		if (!ancestry) {
			const grab = grabs.ancestry;
			const focus = get(w_ancestry_focus);
			const grab_containsFocus = !!grab && !!focus && focus.isAProgenyOf(grab)
			ancestry = (!!grab && !grab_containsFocus) ? grab : focus;
		}
		if (!presented || !presented.equals(ancestry)) {
			w_ancestry_forDetails.set(ancestry);
		}
	}

}

export const x = new X_Identifiables();
