import { Thing, Trait, Hierarchy, Relationship } from '../common/Global_Imports';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	file	 = 'file',
	test	 = 'test',
}

export enum DatumType {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
}

export default interface DBInterface {
	baseID: string;
	dbType: string;
	hasData: boolean;
	isPersistent: boolean;
	hierarchy: Hierarchy;
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
}
