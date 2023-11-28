import { k, debug, PersistID, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { id_here, expanded, ids_grabbed, showDetails } from './State';

class Launch {
	queryStrings: URLSearchParams | null = null;
	setup() {
		this.queryStrings = new URLSearchParams(window.location.search);
		persistLocal.restore();
		k.applyQueryStrings(this.queryStrings);
		this.applyQueryStrings(this.queryStrings);
		debug.applyQueryStrings(this.queryStrings);
		dbDispatch.applyQueryStrings(this.queryStrings); // do this last
		document.title = this.title;
	}

	get title(): string {
		const host = isServerLocal() ? 'local' : 'remote';
		const baseID = dbDispatch.db.baseID;
		const name = baseID ? (baseID! + ', ') : '';
		return 'Seriously (' + host + ', ' + getBrowserType() + ', ' + name + 'α)'
	}

	applyQueryStrings(queryStrings: URLSearchParams) {
		if (queryStrings.get('settings') === 'erase') {
			ids_grabbed.set([]);
			expanded.set([]);
			id_here.set(null);
		}
		if (queryStrings.get('details') === 'hide') {
			persistLocal.writeToKey(PersistID.details, false);
			showDetails.set(false);
		}
	}
    
}

export const launch = new Launch();