import { k, get, debug, PersistID, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { id_here, expanded, ids_grabbed, showDetails } from './State';

class Launch {
	setup() {
		const queryStrings = new URLSearchParams(window.location.search);
		persistLocal.restore();
		k.applyQueryStrings(queryStrings);
		this.applyQueryStrings(queryStrings);
		debug.applyQueryStrings(queryStrings);
		dbDispatch.applyQueryStrings(queryStrings); // do this last
		document.title = this.title;
		if (k.eraseSettings) {
			ids_grabbed.set([]);
			expanded.set([]);
			id_here.set(null);
		}
	}

	get title(): string {
		const baseID = dbDispatch.db.baseID;
		const name = baseID ? (baseID! + ', ') : '';
		const host = isServerLocal() ? 'local' : 'remote';
		return `Seriously (${host}, ${name}${getBrowserType()}, α)`;
	}

	applyQueryStrings(queryStrings: URLSearchParams) {
		if (queryStrings.get('details') === 'hide') {
			persistLocal.writeToKey(PersistID.details, false);
			showDetails.set(false);
		}
	}
    
}

export const launch = new Launch();