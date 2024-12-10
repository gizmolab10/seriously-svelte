import { k, Thing, Trait, Hierarchy, IDPersistent, Relationship } from '../common/Global_Imports';
import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export default class DBCommon {
	hierarchy: Hierarchy | null = null;
	loadTime: string | null = null;
	idPersistence!: IDPersistent;
	isPersistent = false;
	isRemote = false;
	baseID = k.empty;
	dbType = k.empty;
	hasData = false;

	async fetch_all() {}
	async remove_all() {}
	queryStrings_apply() {}
	setHasData(flag: boolean): void {}
	async fetch_hierarchy_from(baseID: string) {}	// support for bulks in firebase

	async thing_persistentUpdate(thing: Thing) {}
	async thing_persistentDelete(thing: Thing) {}
	async thing_remember_persistentCreate(thing: Thing) {}

	async trait_persistentUpdate(trait: Trait) {}
	async trait_persistentDelete(trait: Trait) {}
	async trait_remember_persistentCreate(trait: Trait) {}

	async relationship_persistentUpdate(relationship: Relationship) {}
	async relationship_persistentDelete(relationship: Relationship) {}
	async relationship_remember_persistentCreate(relationship: Relationship) {}

	async deferred_persistAll() {	// DBLocal and DBTest override this
		const h = this.hierarchy;
		if (!!h) {
			await this.deferred_persistAll_data(h.things);
			await this.deferred_persistAll_data(h.traits);
			await this.deferred_persistAll_data(h.relationships);
		}
	}

	async deferred_persistAll_data(array: Array<PersistentIdentifiable>) {
		array.forEach(async (identifiable) => {
			if (identifiable.needs_persisting_again) {
				identifiable.needs_persisting_again = false;
				await identifiable.persist();
			}
		});
	}

}
