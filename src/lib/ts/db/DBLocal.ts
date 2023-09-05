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
    const idRoot = 'local1';
    const idFirst = 'local2';
    const idSecond = 'local3';
    const idThird = 'local4';
    const idPredicate = 'local5';
    h.rememberThing_runtimeCreate(idRoot, 'seriously', 'blue', '!', -1, true);
    h.rememberThing_runtimeCreate(idFirst, 'first', 'red', 'c', 0, true);
    h.rememberThing_runtimeCreate(idSecond, 'second', 'purple', 'c', 0, true);
    h.rememberThing_runtimeCreate(idThird, 'third', 'orange', 'c', 0, true);
    h.rememberPredicate_runtimeCreate(idPredicate, 'isAParentOf');
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idRoot, idFirst, 0);
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idFirst, idSecond, 0);
    h.rememberRelationship_runtimeCreate(Datum.newID, idPredicate, idSecond, idThird, 0);
  };

  async thing_remoteCreate(thing: Thing) {};
  async thing_remoteUpdate(thing: Thing) {};
  async thing_remoteDelete(thing: Thing) {};
  async relationship_remoteCreate(relationship: Relationship | null) {};
  async relationship_remoteUpdate(relationship: Relationship) {};
  async relationship_remoteDelete(relationship: Relationship) {};
}

export const dbLocal = new DBLocal();