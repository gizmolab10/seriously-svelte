import { get, Thing, DBType, removeAll, hierarchy, Relationship } from '../common/GlobalImports';
import { dbType, isBusy, thingsArrived } from '../managers/State';
import { dataFirebase } from './DataFirebase';
import { dataAirtable } from './DataAirtable';
import { v4 as uuid } from 'uuid';

////////////////////////////////////////////////
// abstraction layer: hides CRUD and firebase //
////////////////////////////////////////////////

export default class Data {
  hasDataForDBType: { [type: string]: boolean } = {};

  constructor() {
    dbType.subscribe((type: string) => {
      if (type) {
        if (this.hasDataForDBType[type] == true) {
          this.resetRootFor(type);
        } else {
          isBusy.set(true);         // also used by Details radio buttons
          thingsArrived.set(false);
          (async () => {            // this will happen when Local sets dbType !!! too early?
            switch (type) {
              case DBType.airtable: await dataAirtable.setup(); break;
              case DBType.firebase: await dataFirebase.setup(); break;
            };
            hierarchy.constructHierarchy(type);
          })();
          
        }
      }
    })
  }

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

  resetRootFor(dbType: string) {
    switch (dbType) {
      case DBType.airtable: hierarchy.resetRootFrom(dataAirtable.things); break;
      case DBType.firebase: hierarchy.resetRootFrom(dataFirebase.things); break;
    }
  }

  async thing_remoteCreate(thing: Thing) { 
    switch (get(dbType)) {
      case DBType.airtable: await dataAirtable.thing_remoteCreate(thing); break;
      case DBType.firebase: await dataFirebase.thing_remoteCreate(thing);
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    switch (get(dbType)) {
      case DBType.airtable: await dataAirtable.thing_remoteUpdate(thing); break;
      case DBType.firebase: await dataFirebase.thing_remoteUpdate(thing); break;
    }
  }

  async thing_remoteDelete(thing: Thing) {
    switch (get(dbType)) {
      case DBType.airtable: await dataAirtable.thing_remoteDelete(thing); break;
      case DBType.firebase: await dataFirebase.thing_remoteDelete(thing); break;
    }
  }

  async relationship_remoteCreate(relationship: Relationship) {
    relationship.updateWriteDate();
    switch (get(dbType)) {
      case DBType.airtable: await dataAirtable.relationship_remoteCreate(relationship); break;
      case DBType.firebase: await dataFirebase.relationship_remoteCreate(relationship); break;
    }
  }

  async relationship_remoteUpdate(relationship: Relationship) {
    relationship.updateWriteDate();
    switch (get(dbType)) {
      case DBType.airtable: await dataAirtable.relationship_remoteUpdate(relationship); break;
      case DBType.firebase: await dataFirebase.relationship_remoteUpdate(relationship); break;
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    switch (get(dbType)) {
      case DBType.airtable: await dataAirtable.relationship_remoteDelete(relationship); break;
      case DBType.firebase: await dataFirebase.relationship_remoteDelete(relationship); break;
    }
  }

  async relationship_remoteWrite(relationship: Relationship) {
    if (!relationship.awaitingCreation) {
      if (relationship.isRemotelyStored) {
        await this.relationship_remoteUpdate(relationship);
      } else {
        await this.relationship_remoteCreate(relationship);
      }
    }
  }

}

export const data = new Data();
