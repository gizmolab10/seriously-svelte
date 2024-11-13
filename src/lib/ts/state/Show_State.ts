import { g, k, w, signals, persistLocal } from '../common/Global_Imports';
import { IDPersistent, Tree_Type } from '../common/Global_Imports';
import { s_show_details, s_tree_type } from './Svelte_Stores';

class Show_State {
	traits		 = false;
	thing_info	 = false;
	arrowheads	 = false;
	debug_cursor = false;
	tinyDots	 = true;

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const shownNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const shown = Object.fromEntries(shownNames.map(s => [s, true]) ?? {});
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const keyedFlags: { [key: string]: boolean } = {...shown, ...hidden};
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					s_show_details.set(flag);
					break;
				case 'traits':
					this.traits = flag;
					persistLocal.write_key(IDPersistent.traits, flag);
					break;
				case 'tinyDots':
					this.tinyDots = flag;
					persistLocal.write_key(IDPersistent.tinyDots, flag);
					break;
				case 'info':
					this.thing_info = flag;
					persistLocal.write_key(IDPersistent.thing_info, flag);
					break;
				case 'arrowheads':
					this.arrowheads = flag;
					persistLocal.write_key(IDPersistent.arrowheads, flag);
					break;
			}
		}
	}

	restore_state() {
		this.traits = persistLocal.read_key(IDPersistent.traits) ?? false;
		this.tinyDots = persistLocal.read_key(IDPersistent.tinyDots) ?? false;
		s_show_details.set(persistLocal.read_key(IDPersistent.details) ?? false);
		this.arrowheads = persistLocal.read_key(IDPersistent.arrowheads) ?? false;
		this.thing_info = persistLocal.read_key(IDPersistent.thing_info) ?? false;
		s_tree_type.set(persistLocal.read_key(IDPersistent.tree_type) ?? Tree_Type.children);
	}

	reactivity_subscribe() {
		s_tree_type.subscribe((relations: string) => {
			persistLocal.write_key(IDPersistent.tree_type, relations);
		});
		s_show_details.subscribe((flag: boolean) => {
			persistLocal.write_key(IDPersistent.details, flag);
			w.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
		});
    }

}

export let show = new Show_State();