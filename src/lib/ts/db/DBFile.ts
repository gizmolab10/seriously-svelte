import { k, Thing, Trait, Hierarchy, Relationship } from '../common/Global_Imports';
import { DBType, DatumType } from '../basis/PersistentIdentifiable';
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

	fetch() {}
	persist() {}

	async fetch_all() {
		const id = this.baseID;
		await this.fetch_documentsOf(DatumType.predicates, id);
		await this.fetch_documentsOf(DatumType.things, id);
		await this.fetch_documentsOf(DatumType.traits, id);
		await this.fetch_documentsOf(DatumType.relationships, id);
	}
		
	async fetch_documentsOf(datum_type: DatumType, baseID: string | null = null) {
		const fileName = `${baseID}.${datum_type.toLowerCase()}`;
		// read from file whose name is base id + type
		console.log(`fetch ${datum_type} from ${fileName}`);
		// read json from files located at 'local_data'
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