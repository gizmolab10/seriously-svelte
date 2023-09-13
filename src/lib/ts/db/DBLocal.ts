import { Datum, Thing, DBType, Hierarchy, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';

export default class DBLocal implements DBInterface {
  _hierarchy: Hierarchy | null = null;
  dbType = DBType.local;
  hasData = false;

  get hierarchy(): Hierarchy { 
    if (this._hierarchy == null) {
      this._hierarchy = new Hierarchy(this);
    }
    return this._hierarchy!;
  }

  async setup() {
    const h = this.hierarchy;
    const idPredicate = 'localP';
    const idRoot = 'localRoot';
    const idA = 'localA';
    const idB = 'localB';
    const idC = 'localC';
    const idD = 'localD';
    const idE = 'localE';
    h.rememberThing_runtimeCreate(idRoot, 'seriously', 'blue', '!', -1, true);
    h.rememberThing_runtimeCreate(idA, 'first', 'red', '1', 0, true);
    h.rememberThing_runtimeCreate(idB, 'sibling', 'green', 'a', 0, true);
    h.rememberThing_runtimeCreate(idC, 'really very, very, very, very long, long, long title', 'orchid', 'a', 0, true);
    h.rememberThing_runtimeCreate(idD, 'second', 'purple', '2', 0, true);
    h.rememberThing_runtimeCreate(idE, 'third', 'orange', '3', 0, true);
    h.rememberPredicate_runtimeCreate(idPredicate, 'isAParentOf');
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idRoot, idA, 0);
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idRoot, idB, 0);
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idRoot, idC, 0);
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idA, idD, 0);
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idA, idE, 0);
  };

  async thing_remoteCreate(thing: Thing) {};
  async thing_remoteUpdate(thing: Thing) {};
  async thing_remoteDelete(thing: Thing) {};
  async relationship_remoteCreate(relationship: Relationship | null) {};
  async relationship_remoteUpdate(relationship: Relationship) {};
  async relationship_remoteDelete(relationship: Relationship) {};
}

export const dbLocal = new DBLocal();