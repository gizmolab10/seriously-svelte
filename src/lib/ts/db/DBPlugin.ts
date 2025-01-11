import { k, u, Thing, Trait, Predicate, Relationship } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import { Hierarchy } from '../common/Global_Imports';
import DBCommon from './DBCommon';

export default class DBPlugin extends DBCommon {
	dbType = DBType.plugin;
	isPersistent = true;
	baseID = k.empty;

	get h(): Hierarchy { return this.hierarchy; }

	async fetch_all() {}
	async remove_all() {}
	async persist_all() {}

	async thing_persistentUpdate(thing: Thing) { this.persist_all(); }
	async thing_persistentDelete(thing: Thing) { this.persist_all(); }
	async thing_remember_persistentCreate(thing: Thing) { this.h.thing_remember(thing); this.persist_all(); }

	async trait_persistentUpdate(trait: Trait) { this.persist_all(); }
	async trait_persistentDelete(trait: Trait) { this.persist_all(); }
	async trait_remember_persistentCreate(trait: Trait) { this.h.trait_remember(trait); this.persist_all(); }
	
	async predicate_persistentUpdate(predicate: Predicate) { this.persist_all(); }
	async predicate_persistentDelete(predicate: Predicate) { this.persist_all(); }
	async predicate_remember_persistentCreate(predicate: Predicate) { this.h.predicate_remember(predicate); this.persist_all(); }

	async relationship_persistentUpdate(relationship: Relationship) { this.persist_all(); }
	async relationship_persistentDelete(relationship: Relationship) { this.persist_all(); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.h.relationship_remember(relationship); this.persist_all(); }
}

export const dbPlugin = new DBPlugin();