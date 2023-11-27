import { k, PersistID, persistLocal } from '../common/GlobalImports';
import { idsGrabbed } from './State';

export default class Embed {

	constructor() {
		idsGrabbed.subscribe((ids: string[]) => { // executes whenever idsGrabbed changes
            this.sendGrabbedIDs(ids);
		});
	};

    sendGrabbedIDs(ids: string[]) {
        if (ids) { //  && k.isEmbedded
            const message = ids?.join('$');
            //@ts-ignore
            window.parent.bubble_fn_select(message);
            persistLocal.writeToKey(PersistID.select, message);
            console.log('iframe', message);
        }
    }
}

export const embed = new Embed();