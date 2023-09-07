import { Thing, DBType, Hierarchy, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';

export default class Foo implements DBInterface {
  _hierarchy: Hierarchy | null = null;
  dbType = DBType.airtable;
  hasData = false;

  get hierarchy(): Hierarchy { 
    if (this._hierarchy == null) {
      this._hierarchy = new Hierarchy(this);
    }
    return this._hierarchy!;
  }

  async setup() {}
  async thing_remoteCreate(thing: Thing) {}
  async thing_remoteUpdate(thing: Thing) {}
  async thing_remoteDelete(thing: Thing) {}
  async relationship_remoteCreate(relationship: Relationship | null) {}
  async relationship_remoteUpdate(relationship: Relationship) {}
  async relationship_remoteDelete(relationship: Relationship) {}
}

export const foo = new Foo();