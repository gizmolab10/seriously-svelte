import { k, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { idHere, expanded, idsGrabbed } from './State';

class Launch {

	setup() {
		document.title = 'Seriously ('+ (isServerLocal() ? 'local' : 'remote') + ', ' + getBrowserType()  + ', α)';
		const queryStrings = new URLSearchParams(window.location.search);
		persistLocal.restore();
		k.applyQueryStrings(queryStrings);
		this.applyQueryStrings(queryStrings);
		dbDispatch.applyQueryStrings(queryStrings);
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