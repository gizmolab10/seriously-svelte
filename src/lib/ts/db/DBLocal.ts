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
	setHasData(flag: boolean) { this.hasData = flag; }

	async remove_all() {
		persistLocal.write_key(IDPersistent.local, null);
	}

	async deferred_persistAll() {
		const json_object = u.stringify_object(this.h.all_data);
		persistLocal.write_key(IDPersistent.local, json_object);
	}

	async fetch_all() {
		const json_object = persistLocal.read_key(IDPersistent.local);
		if (!!json_object) {
			const object = JSON.parse(json_object);
			await this.h.extract_hierarchy_from(object as Dictionary);
		} else {
			this.h.predicate_remember_runtimeCreateUnique(Predicate.idContains, 'contains', false, false);
			this.h.predicate_remember_runtimeCreateUnique(Predicate.idIsRelated, 'isRelated', true, false);
			this.h.thing_remember_runtimeCreateUnique(this.baseID, k.empty, 'click here to edit this title', 'limegreen', ThingType.root);
		}
	}

	async thing_persistentUpdate(thing: Thing) { this.deferred_persistAll(); }
	async thing_persistentDelete(thing: Thing) { this.deferred_persistAll(); }
	async thing_remember_persistentCreate(thing: Thing) { this.h.thing_remember(thing); this.deferred_persistAll(); }

	async trait_persistentUpdate(trait: Trait) { this.deferred_persistAll(); }
	async trait_persistentDelete(trait: Trait) { this.deferred_persistAll(); }
	async trait_remember_persistentCreate(trait: Trait) { this.h.trait_remember(trait); this.deferred_persistAll(); }

	async relationship_persistentUpdate(relationship: Relationship) { this.deferred_persistAll(); }
	async relationship_persistentDelete(relationship: Relationship) { this.deferred_persistAll(); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.h.relationship_remember(relationship); this.deferred_persistAll(); }
}

export const dbLocal = new DBLocal();