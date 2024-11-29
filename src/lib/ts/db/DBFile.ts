import { k, Thing, Trait, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { DBType, DatumType } from '../db/DBInterface';
// import { s_hierarchy } from '../state/Svelte_Stores';
import DBInterface from './DBInterface';
// import { get } from 'svelte/store';

export default class DBFile implements DBInterface {
	baseID = k.baseID_file;
	hierarchy!: Hierarchy;
	dbType = DBType.file;
	isPersistent = true;
	hasData = false;
	loadTime = null;

	setHasData(flag: boolean) { this.hasData = flag; }

	async fetch_all() {
		await this.fetch_documentsOf(DatumType.predicates);
		await this.fetch_documentsOf(DatumType.things, this.baseID);
		await this.fetch_documentsOf(DatumType.traits, this.baseID);
		await this.fetch_documentsOf(DatumType.relationships, this.baseID);
	}
		
	async fetch_documentsOf(datum_type: DatumType, baseID: string | null = null) {
		// read json from files located at 'local_data'
	}

	queryStrings_apply() {}
	async fetch_hierarchy_from(baseID: string) {}
	async thing_persistentUpdate(thing: Thing) {}
	async thing_persistentDelete(thing: Thing) {}
	async trait_persistentUpdate(trait: Trait) {}
	async trait_persistentDelete(trait: Trait) {}
	async trait_remember_persistentCreate(trait: Trait) {}
	async thing_remember_persistentCreate(thing: Thing) {}
	async relationship_persistentUpdate(relationship: Relationship) {}
	async relationship_persistentDelete(relationship: Relationship) {}
	async relationship_remember_persistentCreate(relationship: Relationship | null) {}
}

export const dbFile = new DBFile();