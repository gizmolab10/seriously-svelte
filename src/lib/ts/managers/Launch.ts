import { k, debug, builds, EditMode, debugReact, PersistID, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { id_here, expanded, edit_mode, ids_grabbed, showDetails } from './State';

class Launch {
	setup() {
		const queryStrings = new URLSearchParams(window.location.search);
		document.title = this.title;
		builds.setup();
		persistLocal.restore();
		edit_mode.set(EditMode.normal);
		k.applyQueryStrings(queryStrings);
		this.applyQueryStrings(queryStrings);
		debug.applyQueryStrings(queryStrings);
		debugReact.applyQueryStrings(queryStrings);
		dbDispatch.applyQueryStrings(queryStrings); // do this last
	}

	get title(): string {
		const baseID = dbDispatch.db.baseID;
		const name = baseID ? (baseID! + ', ') : '';
		const host = isServerLocal() ? 'local' : 'remote';
		return `Seriously (${host}, ${name}${getBrowserType()}, α)`;
	}

	applyQueryStrings(queryStrings: URLSearchParams) {
        const erase = queryStrings.get('erase');
		if (queryStrings.get('details') === 'hide') {
			persistLocal.writeToKey(PersistID.details, false);
			showDetails.set(false);
		}
        if (erase) {
            const flags = erase.split(',');
            for (const option of flags) {
                switch (option) {
                    case 'data':
						dbDispatch.eraseDB = true;
						break;
                    case 'settings': 
						ids_grabbed.set([]);
						expanded.set([]);
						id_here.set(null);
						break;
                }
            }
        }
    }
    
}

export const launch = new Launch();