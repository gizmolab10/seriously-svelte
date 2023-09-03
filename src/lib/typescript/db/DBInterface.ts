import { Thing, Hierarchy, Relationship } from '../common/GlobalImports';

export default interface DBInterface {
  hierarchy: Hierarchy;
  hasData: boolean;
  setup(): Promise<void>;
  thing_remoteCreate(thing: Thing): Promise<void>;
  thing_remoteUpdate(thing: Thing): Promise<void>;
  thing_remoteDelete(thing: Thing): Promise<void>;
  relationship_remoteCreate(relationship: Relationship | null): Promise<void>;
  relationship_remoteUpdate(relationship: Relationship): Promise<void>;
  relationship_remoteDelete(relationship: Relationship): Promise<void>;
  // readAll(): Promise<void>;
  // things_readAll(): Promise<void>;
  // relationships_readAll(): Promise<void>;
  // predicates_readAll(): Promise<void>;
  // access_readAll(): Promise<void>;
  // users_readAll(): Promise<void>;
}
