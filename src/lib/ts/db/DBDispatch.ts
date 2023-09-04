import { dbType, isBusy, idsGrabbed, thingsArrived, idHere } from '../managers/State';
import { DBType, Relationship } from '../common/GlobalImports';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { dbLocal } from './DBLocal';

export default class DBDispatch {
  db: DBInterface;

  constructor() {
    this.db = dbFirebase;
    dbType.subscribe((type: string) => {
      if (type) {
        idHere.set(null);
        idsGrabbed.set([]);
        this.updateDBForType(type);
        this.updateHierarchy(type);
      }
    })
  }

  updateDBForType(type: string) { this.db = this.dbForType(type); }

  dbForType(type: string): DBInterface {
    switch (type) {
      case DBType.airtable: return dbAirtable;
      case DBType.firebase: return dbFirebase;
      default:              return dbLocal;
    }
  }

  updateHierarchy(type: string) {
    const h = this.db.hierarchy;
    if (this.db.hasData) {
      idHere.set(h.cached_idHere);
      idsGrabbed.set(h.grabs.cached_idsGrabbed);
      h.restoreHere();
    } else {
      if (type != DBType.local) {
        isBusy.set(true);         // also used by Details when changing dbType
        thingsArrived.set(false);
      }
      (async () => {              // this will happen when Local sets dbType !!! too early?
        await this.db.setup();
        h.constructHierarchy(type);
      })();
    }
  }

  async relationship_remoteWrite(relationship: Relationship) {
    if (!relationship.awaitingCreation) {
      if (relationship.isRemotelyStored) {
        await this.db.relationship_remoteUpdate(relationship);
      } else {
        await this.db.relationship_remoteCreate(relationship);
      }
    }
  }
}

export const dbDispatch = new DBDispatch();
