import { w_t_treeMode, w_t_countDots, w_show_details } from '../common/Stores';
import { c, k, p, w, signals, T_Preference } from '../common/Global_Imports';
import { T_Info, T_Hierarchy } from '../common/Enumerations';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export class S_Show {
	debug_cursor = false;
	t_trees		 = false;	// future feature: parent trees, ...
	traits		 = false;
	t_info		 = T_Info.focus;

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
				case 'traits':
					this.traits = flag;
					p.write_key(T_Preference.traits, flag);
					break;
			}
		}
	}

	showing_countDots_ofType(t_counts: T_Hierarchy): boolean { return get(w_t_countDots).includes(T_Hierarchy[t_counts]) }
	get children_dots(): boolean { return  this.showing_countDots_ofType(T_Hierarchy.children); }
	get related_dots(): boolean { return  this.showing_countDots_ofType(T_Hierarchy.related); }
	get parent_dots(): boolean { return  this.showing_countDots_ofType(T_Hierarchy.parents); }
	
	restore_state() {
		this.traits = p.read_key(T_Preference.traits) ?? false;
		this.t_info = p.read_key(T_Preference.info) ?? T_Info.focus;
		w_show_details.set(p.read_key(T_Preference.show_details) ?? false);
		w_t_treeMode.set(p.read_key(T_Preference.tree) ?? T_Hierarchy.children);
	}

	reactivity_subscribe() {
		w_t_treeMode.subscribe((relations: string) => {
			p.write_key(T_Preference.tree, relations);
		});
		w_show_details.subscribe((flag: boolean) => {
			p.write_key(T_Preference.show_details, flag);
			w.restore_state();
			signals.signal_reposition_widgets_fromFocus();
		});
    }

}

export let show = new S_Show();