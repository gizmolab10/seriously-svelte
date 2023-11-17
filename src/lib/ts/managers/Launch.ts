import { k, PersistID, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { idHere, expanded, idsGrabbed, showDetails } from './State';

class Launch {
	queryStrings: URLSearchParams | null = null;
	setup() {
		this.queryStrings = new URLSearchParams(window.location.search);
		persistLocal.restore();
		k.applyQueryStrings(this.queryStrings);
		this.applyQueryStrings(this.queryStrings);
		dbDispatch.applyQueryStrings(this.queryStrings);
		document.title = this.title;
	}

	get title(): string {
		const host = isServerLocal() ? 'local' : 'remote';
		const bulkID = dbDispatch.bulkID;
		const name = bulkID ? (bulkID! + ', ') : '';
		return 'Seriously (' + host + ', ' + getBrowserType() + ', ' + name + 'α)'
	}

	applyQueryStrings(queryStrings: URLSearchParams) {
		if (queryStrings.get('settings') === 'erase') {
			idsGrabbed.set([]);
			expanded.set([]);
			idHere.set(null);
		}
		if (queryStrings.get('details') === 'hide') {
			persistLocal.writeToKey(PersistID.details, false);
			showDetails.set(false);
		}
	}
    
}

export const launch = new Launch();