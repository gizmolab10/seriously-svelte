import { k, noop, dbDispatch, persistLocal, isServerLocal, getBrowserType } from '../common/GlobalImports'
import { idsGrabbed } from './State';

class Launch {

	setup() {
		const params = new URLSearchParams(window.location.search);
		document.title = 'Seriously ('+ (isServerLocal() ? 'local' : 'remote') + ', ' + getBrowserType()  + ', α)';
		persistLocal.restore();
		k.applyQueryStrings(params);
		this.applyQueryStrings(params);
		dbDispatch.applyQueryStrings(params);
	}

	applyQueryStrings(params: URLSearchParams) {
		if (params.get('grabs') === 'erase') {
			idsGrabbed.set([]);
		}
	}
    
}

export const launch = new Launch();