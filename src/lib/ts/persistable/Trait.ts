import { k, Persistable, Thing, databases, T_Trait } from '../common/Global_Imports';
import { T_Persistable } from '../database/DBCommon';
import type { Dictionary } from '../common/Types';
import { w_hierarchy } from '../common/Stores';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Trait extends Persistable {
	t_trait: T_Trait = T_Trait.generic;
	ownerID: string = k.empty;
	text: string = k.empty;
	dict: Dictionary = {};

	constructor(idBase: string, id: string, ownerID: string, t_trait: T_Trait, text: string = k.empty, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.traits, id, already_persisted);
		this.ownerID = ownerID;
		this.t_trait = t_trait;
		this.text = text;
	}
	get owner():	   Thing | null { return get(w_hierarchy).thing_forHID(this.ownerID.hash()); }
	get fields(): Airtable.FieldSet { return { type: this.t_trait, ownerID: [this.ownerID], text: this.text, dict: JSON.stringify(this.dict) }; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.trait_persistentUpdate(this);
		} else {
			await databases.db_now.trait_remember_persistentCreate(this);
		}
	}

}
