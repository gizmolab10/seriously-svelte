import { k, Datum, Thing, dbDispatch, TraitType } from '../common/Global_Imports';
import { s_hierarchy } from '../../ts/state/Svelte_Stores';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Trait extends Datum {
	type: TraitType = TraitType.generic;
	ownerID: string = k.empty;
	text: string = k.empty;

	constructor(baseID: string, id: string, ownerID: string, type: TraitType, text: string = k.empty, already_persisted: boolean = false) {
		super(dbDispatch.db.dbType, baseID, id, already_persisted);
		this.ownerID = ownerID;
		this.type = type;
		this.text = text;
	}

	get owner():	   Thing | null { return get(s_hierarchy).thing_forHID(this.ownerID.hash()); }
	get hasNoData():		boolean { return !this.ownerID && !this.type && !this.type; }
	get fields(): Airtable.FieldSet { return { type: this.type, ownerID: [this.ownerID], text: this.text }; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await dbDispatch.db.trait_persistentUpdate(this);
		} else if (dbDispatch.db.isPersistent) {
			await dbDispatch.db.trait_remember_persistentCreate(this);
		}
	}

}
