import { k, Datum, Thing, dbDispatch, TraitType } from '../common/Global_Imports';
import { h } from '../db/DBDispatch';

export default class Trait extends Datum {
	type: TraitType = TraitType.generic;
	ownerID: string = k.empty;
	text: string = k.empty;

	constructor(baseID: string, id: string, ownerID: string, type: TraitType, text: string = k.empty, hasBeen_remotely_saved: boolean = false) {
		super(dbDispatch.db.dbType, baseID, id, hasBeen_remotely_saved);
		this.ownerID = ownerID;
		this.type = type;
		this.text = text;
	}

	get owner(): Thing | null { return h.thing_forHID(this.ownerID.hash()); }
	get hasNoData():  boolean { return !this.ownerID && !this.type && !this.type; }

	async remoteWrite() {
		if (!this.awaitingCreation) {
			this.updateModifyDate();
			if (this.hasBeen_remotely_saved) {
				await dbDispatch.db.trait_remoteUpdate(this);
			} else if (dbDispatch.db.isRemote) {
				await dbDispatch.db.trait_remember_remoteCreate(this);
			}
		}
	}

}
