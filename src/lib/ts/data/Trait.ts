import { k, Datum, Thing, dbDispatch } from '../common/Global_Imports';

export enum TraitType {
	consequence = 'consequence',
	quest = 'quest',
	note = 'note',
	none = 'none',
}

export default class Trait extends Datum {
	type: TraitType = TraitType.none;
	ownerID: string = k.empty;
	text: string = k.empty;
	owner!: Thing;

	constructor(baseID: string, id: string, type: TraitType, text: string = k.empty, hasBeen_remotely_saved: boolean = false) {
		super(dbDispatch.db.dbType, baseID, id, hasBeen_remotely_saved);
		this.type = type;
		this.text = text;
	}
}
