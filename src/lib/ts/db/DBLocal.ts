import { k, Thing, Trait, Predicate, Relationship } from '../common/Global_Imports';
import { DBType } from '../basis/PersistentIdentifiable';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	baseID = k.baseID_file;
	dbType = DBType.local;
	isPersistent = true;
	
	async thing_persistentUpdate(thing: Thing) { this.persist_all(); }
	async thing_persistentDelete(thing: Thing) { this.persist_all(); }
	async thing_remember_persistentCreate(thing: Thing) { this.hierarchy.thing_remember(thing); this.persist_all(); }

	async trait_persistentUpdate(trait: Trait) { this.persist_all(); }
	async trait_persistentDelete(trait: Trait) { this.persist_all(); }
	async trait_remember_persistentCreate(trait: Trait) { this.hierarchy.trait_remember(trait); this.persist_all(); }
	
	async predicate_persistentUpdate(predicate: Predicate) { this.persist_all(); }
	async predicate_persistentDelete(predicate: Predicate) { this.persist_all(); }
	async predicate_remember_persistentCreate(predicate: Predicate) { this.hierarchy.predicate_remember(predicate); this.persist_all(); }

	async relationship_persistentUpdate(relationship: Relationship) { this.persist_all(); }
	async relationship_persistentDelete(relationship: Relationship) { this.persist_all(); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.hierarchy.relationship_remember(relationship); this.persist_all(); }
}

export const dbLocal = new DBLocal();