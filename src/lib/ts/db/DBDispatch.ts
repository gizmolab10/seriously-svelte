import { dbType, isBusy, idsGrabbed, thingsArrived } from '../managers/State';
import { get, DBType, Relationship } from '../common/GlobalImports';
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
        this.db.hierarchy.grabs.cachedGrabbedIDs = get(idsGrabbed);
        this.updateForDBType(type);
        this.updateHierarchy(type);
      }
    })
  }

  updateForDBType(type: string) {
    switch (type) {
      case DBType.airtable: this.db = dbAirtable; break;
      case DBType.firebase: this.db = dbFirebase; break;
      case DBType.local:    this.db = dbLocal;    break;
    }
  }

  updateHierarchy(type: string) {
    if (this.db.hasData) {
      idsGrabbed.set(this.db.hierarchy.grabs.cachedGrabbedIDs);
      this.db.hierarchy.restoreHere();
    } else {
      if (type != DBType.local) {
        isBusy.set(true);         // also used by Details when changing dbType
        thingsArrived.set(false);
      }
      (async () => {              // this will happen when Local sets dbType !!! too early?
        await this.db.setup();
        this.db.hierarchy.constructHierarchy(type);
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
