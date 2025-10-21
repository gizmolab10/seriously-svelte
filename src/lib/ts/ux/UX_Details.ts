import { S_Items, T_Search, T_Detail, T_Direction, T_Storage_Need } from '../common/Global_Imports';
import { w_search_state, w_show_details, w_count_details } from '../managers/Stores';
import { x, show } from '../common/Global_Imports';
import { get } from 'svelte/store';

export class S_Banner_Hideable {
	slot_isVisible = false;
    t_detail!: T_Detail;
	hasBanner = false;
	isBottom = false;

	constructor(t_detail: T_Detail) {
		this.hasBanner = t_detail !== T_Detail.header;
		this.isBottom = t_detail === T_Detail.data;
		this.t_detail = t_detail;
    }

	get si_items(): S_Items<any> {
		switch (this.t_detail) {
			case T_Detail.tags:		 return x.si_tags;
			case T_Detail.selection: return x.si_grabs;
			case T_Detail.traits:	 return x.si_trait_things;
			default:				 return S_Items.dummy;
		}
	}
}

class UX_Details {
	s_banner_hideables_byType: { [t_detail: string]: S_Banner_Hideable } = {};
	t_storage_need = T_Storage_Need.direction;

	constructor() {
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			const s_hideable = new S_Banner_Hideable(t_detail);
			this.s_banner_hideables_byType[t_detail] = s_hideable;
		}
	}
		
	static readonly _____MAIN_SHUTOFF: unique symbol;

	details_toggle_visibility() {
		const show_details = !get(w_show_details);
		w_show_details.set(show_details);
		show.details = show_details;
	}
		
	static readonly _____BANNERS: unique symbol;

	redraw() { w_count_details.update(n => n + 1); }	// force re-render of details

	update(banner_id: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts type check
		const t_detail = T_Detail[banner_id as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	 x.traitThing_select_next(next); break;
			case T_Detail.selection: x.ancestry_select_next(next); break;
			case T_Detail.tags:  	 x.tag_select_next(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const si_items = this.s_banner_hideables_byType[t_detail].si_items;
		let title = T_Detail[t_detail];
		switch (t_detail) {
			case T_Detail.tags:
				title = si_items.title('tag', 'tag', title);
				break;
			case T_Detail.traits:
				title = si_items.title('trait', 'trait', title);
				break;
			case T_Detail.selection:
				const si_found = x.si_found;
				const row	   = si_found.index;
				const found    = si_found.length;
				const grabbed  = si_items.items;
				if (row != null && !!found && found > 1 && get(w_search_state) != T_Search.off) {
					title = si_found.title('search result', 'focus', title);
				} else if (!!grabbed) {
					title = si_items.title('selected', 'focus', title); break;
				}
				break;
			default:
				break;
		}
		return title;
	}

}

export const details = new UX_Details();
