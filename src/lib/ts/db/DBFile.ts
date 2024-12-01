import { k, files, Thing, Trait, ThingType, Hierarchy, Relationship } from '../common/Global_Imports';
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

	setHasData(flag: boolean) { this.hasData = flag; }
	json_fileName_for(datum_type: string): string { return `${this.baseID}.${datum_type.toLowerCase()}.json`; }

	persist() { files.download_json_object_toFile(get(s_hierarchy).all_data, 'data.json'); }

	async fetch_all() {
		const h = get(s_hierarchy);
		await this.fetch_documentsOf(DatumType.predicates);
		await this.fetch_documentsOf(DatumType.things);
		await this.fetch_documentsOf(DatumType.traits);
		await this.fetch_documentsOf(DatumType.relationships);
		h.predicate_remember_runtimeCreateUnique('contains', 'contains', false, false);
		h.thing_remember_runtimeCreateUnique(this.baseID, 'R', 'JSON', 'limegreen', ThingType.root);
	}
	
	async fetch_documentsOf(datum_type: string) {
		const fileName = this.json_fileName_for(datum_type);
		const reader = new FileReader();
		const file = new File([], fileName, {});
		let content = '';

		// Define what happens when the file is read
		reader.onload = function (e) {
			const result = (e.target?.result as string) ?? '';
			console.log(`${fileName} "${result}"`);
			// content = JSON.parse(result);
			// console.log(content);
		};

		// Define error handling
		reader.onerror = function () {
			content = 'Error reading file.';
		};

		// Read the file as text
		reader.readAsText(file);
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