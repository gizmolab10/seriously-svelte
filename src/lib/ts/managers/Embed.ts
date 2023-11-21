import { PersistID, persistLocal } from '../common/GlobalImports';
import { idsGrabbed } from './State';

export default class Embed {

	constructor() {
		idsGrabbed.subscribe((ids: string[] | undefined) => { // executes whenever idsGrabbed changes
            this.iframeEvent(ids);
		});
	};

    iframeEvent(ids: string[] | undefined) {
        // window.parent.bubble_fn_select();
        const message = ids?.join('$');
		persistLocal.writeToKey(PersistID.select, message);
        console.log('iframe', message);
    }
}

export const embed = new Embed();