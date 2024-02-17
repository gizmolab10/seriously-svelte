import { g, k, u, debug, builds, debugReact, IDPersistant, dbDispatch, persistLocal } from '../common/GlobalImports'
import { s_path_here, s_showDetails, s_paths_grabbed, s_paths_expanded } from './State';

class Launch {
	queryString: URLSearchParams;

	constructor() {
		this.queryString = new URLSearchParams(window.location.search);
	}

	setup() {
		document.title = this.browserTitle;
		builds.setup();
		persistLocal.restore();
		k.applyQueryStrings(this.queryString);
		this.applyQueryStrings(this.queryString);
		debug.applyQueryStrings(this.queryString);
		debugReact.applyQueryStrings(this.queryString);
		dbDispatch.applyQueryStrings(this.queryString); // do these two last
		g.setup();
	}

	get browserTitle(): string {
		const baseID = dbDispatch.db.baseID;
		const name = baseID ? (baseID! + ', ') : '';
		const host = u.isServerLocal() ? 'local' : 'remote';
		return `Seriously (${host}, ${name}${u.getBrowserType()}, α)`;
	}

	applyQueryStrings(queryString: URLSearchParams) {
        const erase = queryString.get('erase');
        const locate = queryString.get('locate');
		if (queryString.get('controls') === 'show') {
			persistLocal.writeToKey(IDPersistant.controls, true);
			g.showControls = true;
		}
		if (queryString.get('details') === 'hide') {
			persistLocal.writeToKey(IDPersistant.details, false);
			s_showDetails.set(false);
		}
        if (locate) {
            for (const option of locate.split(',')) {
                switch (option) {
                    case 'titleAtTop':
						persistLocal.writeToKey(IDPersistant.title_atTop, true);
						g.titleIsAtTop = true;
						break;
				}
			}
		}
        if (erase) {
            for (const option of erase.split(',')) {
                switch (option) {
                    case 'data':
						dbDispatch.eraseDB = true;
						break;
                    case 'settings': 
						localStorage.clear();
						s_path_here.set(g.rootPath);
						s_paths_grabbed.set([]);
						s_paths_expanded.set([]);
						break;
                }
            }
        }
    }
    
}

export const launch = new Launch();
