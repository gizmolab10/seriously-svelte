import { k, debug, builds, debugReact, PersistID, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { path_here, paths_expanded, paths_grabbed, showDetails } from './State';

class Launch {
	setup() {
		const queryStrings = new URLSearchParams(window.location.search);
		document.title = this.title;
		builds.setup();
		persistLocal.restore();
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
						localStorage.clear();
						paths_grabbed.set([]);
						path_here.set(null);
						paths_expanded.set([]);
						break;
                }
            }
        }
    }
    
}

export const launch = new Launch();