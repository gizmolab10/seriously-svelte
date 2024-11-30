import { Thing, Trait, Hierarchy, Relationship } from '../common/Global_Imports';

export enum CRUD {
	create = 'create',
	update = 'update',
	delete = 'delete',
}

export default interface DBInterface {
	baseID: string;
	dbType: string;
	persist(): void;
	hasData: boolean;
	hierarchy: Hierarchy;
	isPersistent: boolean;
	loadTime: string | null;
	queryStrings_apply(): void;
	fetch_all(): Promise<void>;
	setHasData(flag: boolean): void;
	thing_persistentUpdate(thing: Thing): Promise<void>;
	thing_persistentDelete(thing: Thing): Promise<void>;
	trait_persistentUpdate(trait: Trait): Promise<void>;
	trait_persistentDelete(trait: Trait): Promise<void>;
	fetch_hierarchy_from(baseID: string): Promise<void>;
	trait_remember_persistentCreate(trait: Trait): Promise<void>;
	thing_remember_persistentCreate(thing: Thing): Promise<void>;
	relationship_persistentUpdate(relationship: Relationship): Promise<void>;
	relationship_persistentDelete(relationship: Relationship): Promise<void>;
	relationship_remember_persistentCreate(relationship: Relationship | null): Promise<void>;
	crud_onThing(crud: string, thing: Thing): Promise<void>;
	crud_onTrait(crud: string, trait: Trait): Promise<void>;
	crud_onRelationship(crud: string, relationship: Relationship): Promise<void>;
}
