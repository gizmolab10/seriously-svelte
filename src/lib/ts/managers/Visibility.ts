import { c, k, p, g_tree, layout, T_Kinship, T_Preference } from '../common/Global_Imports';
import { w_show_details, w_show_related , w_show_countDots_ofType} from './Stores';
import { w_show_graph_ofType, w_search_show_controls } from './Stores';
import type { Dictionary } from '../types/Types';
import { get } from 'svelte/store';

export class Visibility {
	debug_cursor = false;
	details = false;

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
				case 'related':
					w_show_related.set(flag);
					break;
				case 'parents':
					const mode = flag ? T_Kinship.parents : T_Kinship.children;
					g_tree.set_tree_types([mode]);
					break;
			}
		}
	}

	isShowing_countDots_ofType(t_counts: T_Kinship): boolean { return get(w_show_countDots_ofType).includes(T_Kinship[t_counts]) }
	get children_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.children); }
	get related_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.related); }
	get parent_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.parents); }

	restore_state() {
		w_show_details.set(p.read_key(T_Preference.show_details) ?? false);
		w_show_related.set(p.read_key(T_Preference.show_related) ?? false);
	}
	
	reactivity_subscribe() {
		function reactTo(t_preference: T_Preference, flag: any) {
			p.write_key(t_preference, flag);
			layout.restore_state();
			layout.grand_layout();
		}
		w_show_details.subscribe((flag: any) => {
			reactTo(T_Preference.show_details, flag);
		});
		w_show_related.subscribe((flag: any) => {
			reactTo(T_Preference.show_related, flag);
		});
		w_show_graph_ofType.subscribe((flag: any) => {
			reactTo(T_Preference.graph, flag);
		});
		w_search_show_controls.subscribe((flag: any) => {
			reactTo(T_Preference.show_related, flag);
		});
    }
}

export let show = new Visibility();