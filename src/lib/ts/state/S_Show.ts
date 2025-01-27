import { g, k, w, signals, preferences, T_Preference } from '../common/Global_Imports';
import { s_details_show, s_t_tree } from './S_Stores';
import { T_Info, T_Tree } from '../common/Enumerations';
import type { Dictionary } from '../common/Types';

export class S_Show {
	t_info	 = T_Info.focus;
	debug_cursor = false;
	t_trees	 = false;
	arrowheads	 = false;
	traits		 = false;
	tiny_dots	 = true;

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
					s_details_show.set(flag);
					break;
				case 'traits':
					this.traits = flag;
					preferences.write_key(T_Preference.traits, flag);
					break;
				case 'tiny_dots':
					this.tiny_dots = flag;
					preferences.write_key(T_Preference.tiny_dots, flag);
					break;
				case 'arrowheads':
					this.arrowheads = flag;
					preferences.write_key(T_Preference.arrowheads, flag);
					break;
			}
		}
	}

	restore_state() {
		this.traits = preferences.read_key(T_Preference.traits) ?? false;
		this.tiny_dots = preferences.read_key(T_Preference.tiny_dots) ?? false;
		s_details_show.set(preferences.read_key(T_Preference.details) ?? false);
		this.arrowheads = preferences.read_key(T_Preference.arrowheads) ?? false;
		this.t_info = preferences.read_key(T_Preference.t_info) ?? T_Info.focus;
		s_t_tree.set(preferences.read_key(T_Preference.t_tree) ?? T_Tree.children);
	}

	reactivity_subscribe() {
		s_t_tree.subscribe((relations: string) => {
			preferences.write_key(T_Preference.t_tree, relations);
		});
		s_details_show.subscribe((flag: boolean) => {
			preferences.write_key(T_Preference.details, flag);
			w.restore_state();
			signals.signal_relayoutWidgets_fromFocus();
		});
    }

}

export let show = new S_Show();