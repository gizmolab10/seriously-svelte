import { k, Persistable, Thing, databases, E_Trait } from '../common/Global_Imports';
import { E_Persistable } from '../database/DBCommon';
import type { Dictionary } from '../common/Types';
import { w_hierarchy } from '../common/Stores';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Trait extends Persistable {
	e_trait: E_Trait = E_Trait.generic;
	ownerID: string = k.empty;
	text: string = k.empty;
	dict: Dictionary = {};

	constructor(idBase: string, id: string, ownerID: string, e_trait: E_Trait, text: string = k.empty, already_persisted: boolean = false) {
		super(databases.db_now.e_database, idBase, E_Persistable.traits, id, already_persisted);
		this.ownerID = ownerID;
		this.e_trait = e_trait;
		this.text = text;
	}
	get owner():	   Thing | null { return get(w_hierarchy).thing_forHID(this.ownerID.hash()); }
	get fields(): Airtable.FieldSet { return { type: this.e_trait, ownerID: [this.ownerID], text: this.text, dict: JSON.stringify(this.dict) }; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.trait_persistentUpdate(this);
		} else {
			await databases.db_now.trait_remember_persistentCreate(this);
		}
	}

}
