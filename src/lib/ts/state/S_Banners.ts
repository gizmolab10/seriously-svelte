import { S_Items, T_Detail, T_Direction } from '../common/Global_Imports';
import { w_count_details } from '../managers/Stores';
import { x } from '../common/Global_Imports';

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

	get si_detail(): S_Items<any> { return x.si_forType(this.t_detail); }
}

class S_Banners {
	s_banner_hideables_byType: { [t_detail: string]: S_Banner_Hideable } = {};

	constructor() {
		for (const t_detail of Object.values(T_Detail) as T_Detail[]) {
			const s_hideable = new S_Banner_Hideable(t_detail);
			this.s_banner_hideables_byType[t_detail] = s_hideable;
		}
	}

	redraw() { w_count_details.update(n => n + 1); }	// force re-render of details
	
	static readonly _____BANNERS: unique symbol;

	banner_update(banner_id: string, selected_title: string) {
		const next = T_Direction.next === selected_title as unknown as T_Direction;	// unknown defeats ts type check
		const t_detail = T_Detail[banner_id as keyof typeof T_Detail];
		switch (t_detail) {
			case T_Detail.traits:	 x.traitThing_select_next(next); break;
			case T_Detail.selection: x.ancestry_select_next(next); break;
			case T_Detail.tags:  	 x.tag_select_next(next); break;
		}
	}

	banner_title_forDetail(t_detail: T_Detail): string {
		const si_detail = x.si_forType(t_detail);
		let title = T_Detail[t_detail];
		switch (t_detail) {
			case T_Detail.tags:
				title = si_detail.title('tag', 'tag', title);
				break;
			case T_Detail.traits:
				title = si_detail.title('trait', 'trait', title);
				break;
			case T_Detail.selection:
				const si_found = x.si_found;
				const row	   = si_found.index;
				const found    = si_found.length;
				const grabbed  = si_detail.items;
				if (row != null && !!found && found > 1) {
					title = si_found.title('search result', 'focus', title);
				} else if (!!grabbed) {
					title = si_detail.title('selected', 'focus', title); break;
				}
				break;
			default:
				break;
		}
		return title;
	}

}

export const s_banners = new S_Banners();
