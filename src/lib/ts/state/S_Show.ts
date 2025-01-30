import { g, k, w, signals, preferences, T_Preference } from '../common/Global_Imports';
import { s_t_tree, s_t_counts, s_show_details } from './S_Stores';
import { T_Info, T_Hierarchy } from '../common/Enumerations';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export class S_Show {
	debug_cursor = false;
	t_trees		 = false;	// logic for this is still under construction
	traits		 = false;
	t_info		 = T_Info.focus;

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const visibleNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const visible = Object.fromEntries(visibleNames.map(s => [s, true]) ?? {});
		const keyedFlags: Dictionary<boolean> = {...visible, ...hidden};
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					s_show_details.set(flag);
					break;
				case 'traits':
					this.traits = flag;
					preferences.write_key(T_Preference.traits, flag);
					break;
			}
		}
	}

	showing_countDots_ofType(t_counts: T_Hierarchy): boolean { return get(s_t_counts).includes(T_Hierarchy[t_counts]) }
	get children_dots(): boolean { return  this.showing_countDots_ofType(T_Hierarchy.children); }
	get related_dots(): boolean { return  this.showing_countDots_ofType(T_Hierarchy.related); }
	get parent_dots(): boolean { return  this.showing_countDots_ofType(T_Hierarchy.parents); }
	
	restore_state() {
		this.traits = preferences.read_key(T_Preference.traits) ?? false;
		this.t_info = preferences.read_key(T_Preference.t_info) ?? T_Info.focus;
		s_show_details.set(preferences.read_key(T_Preference.details) ?? false);
		s_t_tree.set(preferences.read_key(T_Preference.t_tree) ?? T_Hierarchy.children);
	}

	reactivity_subscribe() {
		s_t_tree.subscribe((relations: string) => {
			preferences.write_key(T_Preference.t_tree, relations);
		});
		s_show_details.subscribe((flag: boolean) => {
			preferences.write_key(T_Preference.details, flag);
			w.restore_state();
			signals.signal_relayoutWidgets_fromFocus();
		});
    }

}

export let show = new S_Show();