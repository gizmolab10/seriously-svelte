import { Thing, Hierarchy, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';

export default class DBLocal implements DBInterface {
  hasData = false;
  _hierarchy: Hierarchy | null = null;

  get hierarchy(): Hierarchy { 
    if (this._hierarchy == null) {
      this._hierarchy = new Hierarchy();
    }
    return this._hierarchy!;
  }

  resetRoot() {};
  async setup() {};
  async thing_remoteCreate(thing: Thing) {};
  async thing_remoteUpdate(thing: Thing) {};
  async thing_remoteDelete(thing: Thing) {};
  async relationship_remoteCreate(relationship: Relationship | null) {};
  async relationship_remoteUpdate(relationship: Relationship) {};
  async relationship_remoteDelete(relationship: Relationship) {};
}

export const dbLocal = new DBLocal();