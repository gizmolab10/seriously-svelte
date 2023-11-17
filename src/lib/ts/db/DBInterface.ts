import { Thing, Hierarchy, Relationship } from '../common/GlobalImports';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	local	 = 'local',
}

export enum DataKind {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	things		  = 'Things',
	access		  = 'Access',
	users		  = 'Users',
}

export default interface DBInterface {
	dbType: string;
	hasData: boolean;
	hierarchy: Hierarchy;
	loadTime: string | null;
	fetch_all(): Promise<void>;
	setHasData(flag: boolean): void;
	fetch_allFrom(bulkID: string): Promise<void>;
	thing_remember_remoteCreate(thing: Thing): Promise<void>;
	thing_remoteUpdate(thing: Thing): Promise<void>;
	thing_remoteDelete(thing: Thing): Promise<void>;
	relationship_remoteUpdate(relationship: Relationship): Promise<void>;
	relationship_remoteDelete(relationship: Relationship): Promise<void>;
	relationship_remember_remoteCreate(relationship: Relationship | null): Promise<void>;
}
