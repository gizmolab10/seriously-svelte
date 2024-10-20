import { Thing, Trait, Hierarchy, Relationship } from '../common/Global_Imports';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	local	 = 'local',
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
	isRemote: boolean;
	hierarchy: Hierarchy;
	loadTime: string | null;
	queryStrings_apply(): void;
	fetch_all(): Promise<void>;
	setHasData(flag: boolean): void;
	fetch_hierarchy_from(baseID: string): Promise<void>;
	thing_remoteUpdate(thing: Thing): Promise<void>;
	thing_remoteDelete(thing: Thing): Promise<void>;
	thing_remember_remoteCreate(thing: Thing): Promise<void>;
	relationship_remoteUpdate(relationship: Relationship): Promise<void>;
	relationship_remoteDelete(relationship: Relationship): Promise<void>;
	relationship_remember_remoteCreate(relationship: Relationship | null): Promise<void>;
	trait_remoteUpdate(trait: Trait): Promise<void>;
	trait_remoteDelete(trait: Trait): Promise<void>;
	trait_remember_remoteCreate(trait: Trait): Promise<void>;
}
