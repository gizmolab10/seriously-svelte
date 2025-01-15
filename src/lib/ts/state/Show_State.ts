import { g, k, w, signals, preferences } from '../common/Global_Imports';
import { InfoType, Tree_Type, IDPreference } from '../common/Global_Imports';
import { s_show_details, s_tree_type } from './Svelte_Stores';
import type { Dictionary } from '../common/Types';

class Show_State {
	info_type: InfoType	= InfoType.focus;
	debug_cursor		= false;
	tree_types			= false;
	arrowheads			= false;
	traits				= false;
	tiny_dots			= true;

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
					preferences.write_key(IDPreference.traits, flag);
					break;
				case 'tiny_dots':
					this.tiny_dots = flag;
					preferences.write_key(IDPreference.tiny_dots, flag);
					break;
				case 'arrowheads':
					this.arrowheads = flag;
					preferences.write_key(IDPreference.arrowheads, flag);
					break;
			}
		}
	}

	restore_state() {
		this.traits = preferences.read_key(IDPreference.traits) ?? false;
		this.tiny_dots = preferences.read_key(IDPreference.tiny_dots) ?? false;
		s_show_details.set(preferences.read_key(IDPreference.details) ?? false);
		this.arrowheads = preferences.read_key(IDPreference.arrowheads) ?? false;
		this.info_type = preferences.read_key(IDPreference.info_type) ?? InfoType.focus;
		s_tree_type.set(preferences.read_key(IDPreference.tree_type) ?? Tree_Type.children);
	}

	reactivity_subscribe() {
		s_tree_type.subscribe((relations: string) => {
			preferences.write_key(IDPreference.tree_type, relations);
		});
		s_show_details.subscribe((flag: boolean) => {
			preferences.write_key(IDPreference.details, flag);
			w.restore_state();
			signals.signal_relayoutWidgets_fromFocus();
		});
    }

}

export let show = new Show_State();