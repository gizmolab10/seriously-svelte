import { Thing, Hierarchy, Relationship } from '../common/GlobalImports';

export enum DBType {
	airtable = 'airtable',
	firebase = 'firebase',
	local		= 'local',
}

export enum DataKind {
	users				= 'Users',
	access				= 'Access',
	things				= 'Things',
	predicates		= 'Predicates',
	relationships = 'Relationships',
}

export default interface DBInterface {
	dbType: string;
	hasData: boolean;
	hierarchy: Hierarchy;
	loadTime: string | null;
	setupDB(): Promise<void>;
	thing_remoteCreate(thing: Thing): Promise<void>;
	thing_remoteUpdate(thing: Thing): Promise<void>;
	thing_remoteDelete(thing: Thing): Promise<void>;
	relationship_remoteUpdate(relationship: Relationship): Promise<void>;
	relationship_remoteDelete(relationship: Relationship): Promise<void>;
	relationship_remoteCreate(relationship: Relationship | null): Promise<void>;
}
