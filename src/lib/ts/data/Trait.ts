import { k, Persistable, Thing, databases, T_Trait } from '../common/Global_Imports';
import { T_Persistable } from '../dbs/DBCommon';
import { w_hierarchy } from '../common/Stores';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Trait extends Persistable {
	type: T_Trait = T_Trait.generic;
	ownerID: string = k.empty;
	text: string = k.empty;

	constructor(idBase: string, id: string, ownerID: string, type: T_Trait, text: string = k.empty, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.traits, id, already_persisted);
		this.ownerID = ownerID;
		this.type = type;
		this.text = text;
	}

	get owner():	   Thing | null { return get(w_hierarchy).thing_forHID(this.ownerID.hash()); }
	get fields(): Airtable.FieldSet { return { type: this.type, ownerID: [this.ownerID], text: this.text }; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.trait_persistentUpdate(this);
		} else {
			await databases.db_now.trait_remember_persistentCreate(this);
		}
	}

}
