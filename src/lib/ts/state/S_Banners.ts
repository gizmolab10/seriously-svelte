import { w_search_results_found, w_count_details } from '../managers/Stores';
import { T_Detail, T_Direction } from '../common/Global_Imports';
import { S_Banner_Hideable } from './S_Banner_Hideable';
import { x } from '../common/Global_Imports';
import { get } from 'svelte/store';

class S_Banners {
	s_banner_hideables_byType: { [t_detail: string]: S_Banner_Hideable } = {};

	constructor() {
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			this.s_banner_hideables_byType[t_detail] = new S_Banner_Hideable(t_detail);
		}
	}

	redraw() { w_count_details.update(n => n + 1); }	// force re-render of details
	
	static readonly _____BANNERS: unique symbol;

	banner_update(banner_id: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts
		const t_detail = T_Detail[banner_id as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	 x.traitThing_select_next(next); break;
			case T_Detail.selection: x.ancestry_select_next(next); break;
			case T_Detail.tags:  	 x.tag_select_next(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const normal_title = T_Detail[t_detail];
		switch (t_detail) {	
			case T_Detail.selection:
				const row	  = x.si_found.index;
				const grabbed = get(x.si_grabs.w_items);
				const matches = get(w_search_results_found);
				if (row != null && !!matches && matches > 1) {
					return row.of_n_for_type(matches, 'search result', '');
				} else if (!!grabbed) {
					switch (grabbed.length) {
						case 1:  break;
						case 0:  return 'focus';
						default: return x.si_grabs.index.of_n_for_type(grabbed.length, 'selected', '');
					}
				}
				break;
			default:
				break;
		}
		return normal_title;
	}

}

export const s_banners = new S_Banners();
