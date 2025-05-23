import { w_show_info_ofType, w_show_countDots_ofType, w_show_details, w_show_related, w_device_isMobile } from '../common/Stores';
import { c, k, p, w, layout, T_Preference } from '../common/Global_Imports';
import { T_Info, T_Kinship } from '../common/Enumerations';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

const force_tool_boxes = true;		// true means that the tool boxes are never shown

export class Visibility {
	debug_cursor = false;
	tool_boxes	 = !(get(w_device_isMobile) ?? false) && !force_tool_boxes;

	queryStrings_apply() {
		const queryStrings = c.queryStrings;
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const visibleNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const visible = Object.fromEntries(visibleNames.map(s => [s, true]) ?? {});
		const keyedFlags: Dictionary<boolean> = {...visible, ...hidden};
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					w_show_details.set(flag);
					break;
				case 'related':
					w_show_related.set(flag);
					break;
				case 'parents':
					const mode = flag ? T_Kinship.parent : T_Kinship.child;
					layout.set_t_tree([mode]);
					break;
			}
		}
	}

	showing_countDots_ofType(t_counts: T_Kinship): boolean { return get(w_show_countDots_ofType).includes(T_Kinship[t_counts]) }
	get related_dots(): boolean { return  this.showing_countDots_ofType(T_Kinship.related); }
	get children_dots(): boolean { return  this.showing_countDots_ofType(T_Kinship.child); }
	get parent_dots(): boolean { return  this.showing_countDots_ofType(T_Kinship.parent); }
	get shows_focus(): boolean { return get(w_show_info_ofType) == T_Info.focus; }
	
	restore_state() {
		w_show_details.set(p.read_key(T_Preference.show_details) ?? false);
		w_show_related.set(p.read_key(T_Preference.show_related) ?? false);
	}

	reactivity_subscribe() {
		w_device_isMobile.subscribe((flag: boolean) => {
			this.tool_boxes = !flag && !force_tool_boxes;
		});
		w_show_details.subscribe((flag: boolean) => {
			p.write_key(T_Preference.show_details, flag);
			w.restore_state();
			layout.grand_layout();
		});
		w_show_related.subscribe((flag: boolean) => {
			p.write_key(T_Preference.show_related, flag);
			w.restore_state();
			layout.grand_layout();
		});
    }
}

export let show = new Visibility();