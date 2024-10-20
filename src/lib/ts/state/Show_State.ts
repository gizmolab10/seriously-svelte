import { g, k, signals, persistLocal } from '../common/Global_Imports';
import { IDPersistent, GraphRelations } from '../common/Global_Imports';
import { s_show_details, s_tree_mode } from './Reactive_State';

class Show_State {
	modes		= true;
	tinyDots	= true;
	titleAtTop	= false;
	focus_info	= false;
	arrowheads	= false;
	traits		= false;
	info		= false;

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
				case 'info':
					this.info = flag;
					persistLocal.write_key(IDPersistent.info, flag);
					break;
				case 'traits':
					this.traits = flag;
					persistLocal.write_key(IDPersistent.traits, flag);
					break;
				case 'modes':
					this.modes = flag;
					persistLocal.write_key(IDPersistent.modes, flag);
					break;
				case 'tinyDots':
					this.tinyDots = flag;
					persistLocal.write_key(IDPersistent.tinyDots, flag);
					break;
				case 'arrowheads':
					this.arrowheads = flag;
					persistLocal.write_key(IDPersistent.arrowheads, flag);
					break;
				case 'titleAtTop':
					this.titleAtTop = flag;
					persistLocal.write_key(IDPersistent.title_atTop, flag);
					break;
			}
		}
	}

	restore_state() {
		persistLocal.write_key(IDPersistent.title_atTop, false);
		this.info = persistLocal.read_key(IDPersistent.info) ?? false;
		this.modes = persistLocal.read_key(IDPersistent.modes) ?? true;
		this.traits = persistLocal.read_key(IDPersistent.traits) ?? false;
		this.tinyDots = persistLocal.read_key(IDPersistent.tinyDots) ?? false;
		this.arrowheads = persistLocal.read_key(IDPersistent.arrowheads) ?? false;
		this.focus_info = persistLocal.read_key(IDPersistent.focus_info) ?? false;
		this.titleAtTop = persistLocal.read_key(IDPersistent.title_atTop) ?? false;
		s_tree_mode.set(persistLocal.read_key(IDPersistent.relations) ?? GraphRelations.children);
		s_show_details.set(persistLocal.read_key(IDPersistent.details) ?? false);
	}

	reactivity_subscribe() {
		s_tree_mode.subscribe((relations: string) => {
			persistLocal.write_key(IDPersistent.relations, relations);
		});
		s_show_details.subscribe((flag: boolean) => {
			persistLocal.write_key(IDPersistent.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
		});
    }

}

export let show = new Show_State();