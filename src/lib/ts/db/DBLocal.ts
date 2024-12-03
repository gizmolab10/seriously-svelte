import { k, u, Thing, Trait, ThingType, Hierarchy, Relationship } from '../common/Global_Imports';
import { persistLocal, IDPersistent } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import type { Dictionary } from '../common/Types';
import DBCommon from './DBCommon';
import { get } from 'svelte/store';

export default class DBLocal extends DBCommon {
	baseID = k.baseID_file;
	hierarchy!: Hierarchy;
	dbType = DBType.local;
	isPersistent = true;
	hasData = false;
	loadTime = null;

	setHasData(flag: boolean) { this.hasData = flag; }

	async remove_all() {
		persistLocal.write_key(IDPersistent.local, null);
	}

	async deferred_persistAll() {
		const json_object = u.stringify_object(get(s_hierarchy).all_data);
		persistLocal.write_key(IDPersistent.local, json_object);
	}

	async fetch_all() {
		const json_object = persistLocal.read_key(IDPersistent.local);
		const h = get(s_hierarchy);
		if (!!json_object) {
			const object = JSON.parse(json_object);
			h.extract_hierarchy_from(object as Dictionary);
		}
		h.predicate_remember_runtimeCreateUnique('contains', 'contains', false, false);
		h.thing_remember_runtimeCreateUnique(this.baseID, 'R', 'DBLocal', 'limegreen', ThingType.root);
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

	async crudAction_onThing(crudAction: string, thing: Thing) {};
	async crudAction_onTrait(crudAction: string, trait: Trait) {};
	async crudAction_onRelationship(crudAction: string, relationship: Relationship) {};
}

export const dbFile = new DBLocal();