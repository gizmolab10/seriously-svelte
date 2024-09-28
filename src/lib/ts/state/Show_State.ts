import { g, k, persistLocal, IDPersistant } from '../common/Global_Imports';

class Show_State {
	debug		= false;
	quests		= false;
	titleAtTop	= false;
	arrowheads	= false;
	controls	= true;
	tinyDots	= true;

	queryStrings_apply() {
		const queryStrings = g.queryStrings;
		const shownNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const shown = Object.fromEntries(shownNames.map(s => [s, true]) ?? {});
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const keyedFlags: { [key: string]: boolean } = {...shown, ...hidden};
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'debug':
					this.debug = flag;
					persistLocal.write_key(IDPersistant.debug, flag);
					break;
				case 'quests':
					this.quests = flag;
					persistLocal.write_key(IDPersistant.quests, flag);
					break;
				case 'controls':
					this.controls = flag;
					persistLocal.write_key(IDPersistant.controls, flag);
					break;
				case 'tinyDots':
					this.tinyDots = flag;
					persistLocal.write_key(IDPersistant.tinyDots, flag);
					break;
				case 'arrowheads':
					this.arrowheads = flag;
					persistLocal.write_key(IDPersistant.arrowheads, flag);
					break;
				case 'titleAtTop':
					this.titleAtTop = flag;
					persistLocal.write_key(IDPersistant.title_atTop, flag);
					break;
			}
		}
    }

}

export let show = new Show_State();