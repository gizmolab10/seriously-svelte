import { k, Datum, Thing, databases, T_Trait } from '../../common/Global_Imports';
import { w_hierarchy } from '../../state/S_Stores';
import { T_Datum } from '../dbs/DBCommon';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Trait extends Datum {
	type: T_Trait = T_Trait.generic;
	ownerID: string = k.empty;
	text: string = k.empty;

	constructor(idBase: string, id: string, ownerID: string, type: T_Trait, text: string = k.empty, already_persisted: boolean = false) {
		super(databases.db.t_database, idBase, T_Datum.traits, id, already_persisted);
		this.ownerID = ownerID;
		this.type = type;
		this.text = text;
	}

	get owner():	   Thing | null { return get(w_hierarchy).thing_forHID(this.ownerID.hash()); }
	get fields(): Airtable.FieldSet { return { type: this.type, ownerID: [this.ownerID], text: this.text }; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db.trait_persistentUpdate(this);
		} else if (databases.db.isPersistent) {
			await databases.db.trait_remember_persistentCreate(this);
		}
	}

}
