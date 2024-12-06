import { k, u, Thing, Trait, ThingType, Hierarchy, Relationship } from '../common/Global_Imports';
import { persistLocal, IDPersistent } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../state/Svelte_Stores';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	baseID = k.baseID_file;
	dbType = DBType.local;
	isPersistent = true;

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
			await h.extract_hierarchy_from(object as Dictionary);
		} else {
			h.predicate_remember_runtimeCreateUnique('contains', 'contains', false, false);
			h.predicate_remember_runtimeCreateUnique('isRelated', 'isRelated', true, false);
			h.thing_remember_runtimeCreateUnique(this.baseID, 'R', 'DBLocal', 'limegreen', ThingType.root);
		}
	}

}

export const dbLocal = new DBLocal();