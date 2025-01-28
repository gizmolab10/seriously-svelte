import { k, Thing, Trait, Predicate, Relationship } from '../../common/Global_Imports';
import type { Dictionary } from '../../../ts/common/Types';
import { T_Database, T_Persistence } from './DBCommon';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	kind_persistence = T_Persistence.local;
	t_database = T_Database.local;
	idBase = k.idBase_file;
	
	get dict_forStorageDetails(): Dictionary { return {'data' : 'fast and local'} }
	
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
	async relationship_remember_persistentCreate(relationship: Relationship) { this.hierarchy.relationship_remember_ifValid(relationship); this.persist_all(); }
}

export const dbLocal = new DBLocal();