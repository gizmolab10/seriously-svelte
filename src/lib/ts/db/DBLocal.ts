import { k, u, Thing, Trait, ThingType, Predicate, Relationship } from '../common/Global_Imports';
import { Hierarchy, persistLocal, IDPersistent } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	baseID = k.baseID_file;
	dbType = DBType.local;
	isPersistent = true;

	get h(): Hierarchy { return get(s_hierarchy); }

	async remove_all() {
		persistLocal.write_key(IDPersistent.local, null);
	}

	async persistAll() {
		const json_object = u.stringify_object(this.h.all_data);
		persistLocal.write_key(IDPersistent.local, json_object);
	}

	async fetch_all() {
		const json_object = persistLocal.read_key(IDPersistent.local);
		if (!!json_object) {
			const object = JSON.parse(json_object);
			await this.h.extract_hierarchy_from(object as Dictionary);
		} else {
			this.h.predicate_defaults_remember_runtimeCreate();
			this.h.thing_remember_runtimeCreateUnique(this.baseID, Thing.newID(), 'click here to edit this title', 'limegreen', ThingType.root);
		}
	}

	async thing_persistentUpdate(thing: Thing) { this.persistAll(); }
	async thing_persistentDelete(thing: Thing) { this.persistAll(); }
	async thing_remember_persistentCreate(thing: Thing) { this.h.thing_remember(thing); this.persistAll(); }

	async trait_persistentUpdate(trait: Trait) { this.persistAll(); }
	async trait_persistentDelete(trait: Trait) { this.persistAll(); }
	async trait_remember_persistentCreate(trait: Trait) { this.h.trait_remember(trait); this.persistAll(); }
	
	async predicate_persistentUpdate(predicate: Predicate) { this.persistAll(); }
	async predicate_persistentDelete(predicate: Predicate) { this.persistAll(); }
	async predicate_remember_persistentCreate(predicate: Predicate) { this.h.predicate_remember(predicate); this.persistAll(); }

	async relationship_persistentUpdate(relationship: Relationship) { this.persistAll(); }
	async relationship_persistentDelete(relationship: Relationship) { this.persistAll(); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.h.relationship_remember(relationship); this.persistAll(); }
}

export const dbLocal = new DBLocal();