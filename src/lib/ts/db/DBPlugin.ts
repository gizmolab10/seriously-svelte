import { k, u, Thing, Trait, Predicate, Relationship } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import { Hierarchy } from '../common/Global_Imports';
import DBCommon from './DBCommon';

export default class DBPlugin extends DBCommon {
	dbType = DBType.plugin;
	isPersistent = true;
	baseID = k.empty;

	get h(): Hierarchy { return this.hierarchy; }

	async remove_all() {}
	async persistAll() {}
	async fetch_all() {}

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

export const dbPlugin = new DBPlugin();