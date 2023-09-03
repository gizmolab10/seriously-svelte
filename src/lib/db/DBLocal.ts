import { Datum, Thing, Hierarchy, Relationship } from '../common/GlobalImports';
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

  async setup() {
    const h = this.hierarchy;
    const rootID = Datum.newID;
    const childID = Datum.newID;
    const predicateID = Datum.newID;
    h.rememberThing_runtimeCreate(rootID, 'seriously', 'blue', '!', -1, true);
    h.rememberThing_runtimeCreate(childID, 'child', 'red', 'c', 0, true);
    h.rememberPredicate_runtimeCreate(predicateID, 'isAParentOf');
    h.rememberRelationship_runtimeCreate(Datum.newID, predicateID, rootID, childID, 0);
  };

  async thing_remoteCreate(thing: Thing) {};
  async thing_remoteUpdate(thing: Thing) {};
  async thing_remoteDelete(thing: Thing) {};
  async relationship_remoteCreate(relationship: Relationship | null) {};
  async relationship_remoteUpdate(relationship: Relationship) {};
  async relationship_remoteDelete(relationship: Relationship) {};
}

export const dbLocal = new DBLocal();