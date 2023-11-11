import { k, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { idHere, expanded, idsGrabbed } from './State';

class Launch {
	queryStrings: URLSearchParams | null = null;
	setup() {
		document.title = 'Seriously ('+ (isServerLocal() ? 'local' : 'remote') + ', ' + getBrowserType()  + ', α)';
		this.queryStrings = new URLSearchParams(window.location.search);
		persistLocal.restore();
		k.applyQueryStrings(this.queryStrings);
		this.applyQueryStrings(this.queryStrings);
		dbDispatch.applyQueryStrings(this.queryStrings);
	}

	applyQueryStrings(queryStrings: URLSearchParams) {
		if (queryStrings.get('persist') === 'erase') {
			idsGrabbed.set([]);
			expanded.set([]);
			idHere.set(null);
		}
	}
    
}

export const launch = new Launch();