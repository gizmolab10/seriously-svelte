import { k, Thing, Trait, Hierarchy, Predicate, IDPersistent, Relationship } from '../common/Global_Imports';
import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class DBCommon {
	hierarchy: Hierarchy | null = null;
	loadTime: string | null = null;
	idPersistence!: IDPersistent;
	isPersistent = false;
	baseID = k.empty;
	dbType = k.empty;
	isRemote = false;
	hasData = false;

	async fetch_all() {}
	async remove_all() {}
	queryStrings_apply() {}
	async fetch_hierarchy_from(baseID: string) {}	// support for bulks in firebase

	async thing_persistentUpdate(thing: Thing) {}
	async thing_persistentDelete(thing: Thing) {}
	async thing_remember_persistentCreate(thing: Thing) {}

	async trait_persistentUpdate(trait: Trait) {}
	async trait_persistentDelete(trait: Trait) {}
	async trait_remember_persistentCreate(trait: Trait) {}

	async predicate_persistentUpdate(predicate: Predicate) {}
	async predicate_persistentDelete(predicate: Predicate) {}
	async predicate_remember_persistentCreate(predicate: Predicate) {}

	async relationship_persistentUpdate(relationship: Relationship) {}
	async relationship_persistentDelete(relationship: Relationship) {}
	async relationship_remember_persistentCreate(relationship: Relationship) {}

	async persistAll() {	// DBs that are not REMOTE override this
		const h = this.hierarchy;
		if (!!h) {
			await this.persistAll_identifiables(h.things);
			await this.persistAll_identifiables(h.traits);
			await this.persistAll_identifiables(h.predicates);
			await this.persistAll_identifiables(h.relationships);
		}
	}

	async persistAll_identifiables(identifiables: Array<PersistentIdentifiable>) {
		for (const identifiable of identifiables) {
			if (identifiable.isDirty) {
				identifiable.isDirty = false;
				await identifiable.persist();
			}
		}
	}

}
