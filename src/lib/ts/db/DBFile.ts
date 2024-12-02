import { k, Thing, Trait, ThingType, Hierarchy, Relationship } from '../common/Global_Imports';
import { DBType, DatumType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import DBInterface from './DBInterface';
import { get } from 'svelte/store';

export default class DBFile implements DBInterface {
	baseID = k.baseID_file;
	hierarchy!: Hierarchy;
	dbType = DBType.file;
	isPersistent = true;
	hasData = false;
	loadTime = null;

	persist() { get(s_hierarchy).save_toFile(); }
	setHasData(flag: boolean) { this.hasData = flag; }

	async fetch_all() {
		const h = get(s_hierarchy);
		for (const type of h.all_dataTypes) {
			await this.fetch_documentsOf(type);
		}
		h.predicate_remember_runtimeCreateUnique('contains', 'contains', false, false);
		h.thing_remember_runtimeCreateUnique(this.baseID, 'R', 'JSON', 'limegreen', ThingType.root);
	}
	
	async fetch_documentsOf(datum_type: string) {
		const fileName = `${this.baseID.toLowerCase()}.${datum_type.toLowerCase()}.json`;
		const file = new File([], fileName, {});
		get(s_hierarchy).fetch_fromFile(file);
	}

	queryStrings_apply() {}
	async fetch_hierarchy_from(baseID: string) {}	// support for bulks in firebase

	async thing_persistentUpdate(thing: Thing) {}
	async thing_persistentDelete(thing: Thing) {}
	async thing_remember_persistentCreate(thing: Thing) {}

	async trait_persistentUpdate(trait: Trait) {}
	async trait_persistentDelete(trait: Trait) {}
	async trait_remember_persistentCreate(trait: Trait) {}

	async relationship_persistentUpdate(relationship: Relationship) {}
	async relationship_persistentDelete(relationship: Relationship) {}
	async relationship_remember_persistentCreate(relationship: Relationship | null) {}

	async crud_onThing(crud: string, thing: Thing) {};
	async crud_onTrait(crud: string, trait: Trait) {};
	async crud_onRelationship(crud: string, relationship: Relationship) {};
}

export const dbFile = new DBFile();