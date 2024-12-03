import { k, Thing, Trait, Hierarchy, Relationship } from '../common/Global_Imports';
import PersistentIdentifiable from '../basis/PersistentIdentifiable';

export enum CRUD {
	create = 'create',
	update = 'update',
	delete = 'delete',
}

export default class DBCommon {
	hasData = false;
	baseID = k.empty;
	dbType = k.empty;
	isPersistent = false;
	loadTime: string | null = null;
	hierarchy: Hierarchy | null = null;

	queryStrings_apply() {}
	setHasData(flag: boolean): void {}
	async remove_all(): Promise<void> {}
	async fetch_all(): Promise<void> {}
	async thing_persistentUpdate(thing: Thing): Promise<void> {}
	async thing_persistentDelete(thing: Thing): Promise<void> {}
	async trait_persistentUpdate(trait: Trait): Promise<void> {}
	async trait_persistentDelete(trait: Trait): Promise<void> {}
	async fetch_hierarchy_from(baseID: string): Promise<void> {}
	async trait_remember_persistentCreate(trait: Trait): Promise<void> {}
	async thing_remember_persistentCreate(thing: Thing): Promise<void> {}
	async relationship_persistentUpdate(relationship: Relationship): Promise<void> {}
	async relationship_persistentDelete(relationship: Relationship): Promise<void> {}
	async relationship_remember_persistentCreate(relationship: Relationship | null): Promise<void> {}
	async crudAction_onThing(crudAction: string, thing: Thing): Promise<void> {}
	async crudAction_onTrait(crudAction: string, trait: Trait): Promise<void> {}
	async crudAction_onRelationship(crudAction: string, relationship: Relationship): Promise<void> {}

	async deferred_persistAll() {
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
