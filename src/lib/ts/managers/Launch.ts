import { k, debug, builds, debugReact, PersistID, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { s_path_here, s_paths_expanded, s_paths_grabbed, s_showDetails } from './State';

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
			s_showDetails.set(false);
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
						s_paths_grabbed.set([]);
						s_path_here.set(null);
						s_paths_expanded.set([]);
						break;
                }
            }
        }
    }
    
}

export const launch = new Launch();