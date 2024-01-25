import { k, u, debug, builds, debugReact, PersistID, dbDispatch, persistLocal } from '../common/GlobalImports'
import { s_setup, s_path_here, s_paths_expanded, s_paths_grabbed, s_showDetails } from './State';

class Launch {
	queryString: URLSearchParams;

	constructor() {
		this.queryString = new URLSearchParams(window.location.search);
	}

	setup() {
		document.title = this.title;
		builds.setup();
		persistLocal.restore();
		k.applyQueryStrings(this.queryString);
		this.applyQueryStrings(this.queryString);
		debug.applyQueryStrings(this.queryString);
		debugReact.applyQueryStrings(this.queryString);
		dbDispatch.applyQueryStrings(this.queryString); // do this last
		s_setup();
	}

	get title(): string {
		const baseID = dbDispatch.db.baseID;
		const name = baseID ? (baseID! + ', ') : '';
		const host = u.isServerLocal() ? 'local' : 'remote';
		return `Seriously (${host}, ${name}${u.getBrowserType()}, α)`;
	}

	applyQueryStrings(queryString: URLSearchParams) {
        const erase = queryString.get('erase');
		if (queryString.get('details') === 'hide') {
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
						s_path_here.set(dbDispatch.db.hierarchy.uniquePath());
						s_paths_grabbed.set([]);
						s_paths_expanded.set([]);
						break;
                }
            }
        }
    }
    
}

export const launch = new Launch();
