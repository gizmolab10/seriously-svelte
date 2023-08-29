import { get, Thing, DBType, removeAll, hierarchy, Relationship } from '../common/GlobalImports';
import { dbType, isBusy, thingsArrived } from '../managers/State';
import { firebase } from './RemoteFirebase';
import { v4 as uuid } from 'uuid';
import { crud } from './RemoteAirtable';

////////////////////////////////////////////////
// abstraction layer: hides CRUD and firebase //
////////////////////////////////////////////////

export default class Cloud {
  hasDataForDBType: { [type: string]: boolean } = {};

  constructor() {
    dbType.subscribe((type: string) => {
      if (type) {
        if (this.hasDataForDBType[type] == true) {
          this.resetRootFor(type);
        } else {
          isBusy.set(true);    // also used by Details radio buttons
          thingsArrived.set(false);
          this.setup(type).then(() => {
            // this will happen when Local sets dbType !!! too early?
            hierarchy.constructHierarchy(type);
          })
        }
      }
    })
  }

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

  async setup(dbType: string): Promise<void> {
    return new Promise(async (resolve) => {
      switch (dbType) {
        case DBType.airtable: crud.setup().then(() => { resolve() }); break;
        default: firebase.setup().then(() => { resolve() }); break;
      }
    });
  }

  resetRootFor(dbType: string) {
    switch (dbType) {
      case DBType.airtable: hierarchy.resetRootFrom(crud.things); break;
    }
  }

  async thing_remoteCreate(thing: Thing) { 
    switch (get(dbType)) {
      case DBType.airtable: await crud.thing_remoteCreate(thing); break;
      default: await firebase.thing_remoteCreate(thing);
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    switch (get(dbType)) {
      case DBType.airtable: await crud.thing_remoteUpdate(thing); break;
      default: await firebase.thing_remoteUpdate(thing); break;
    }
  }

  async thing_remoteDelete(thing: Thing) {
    switch (get(dbType)) {
      case DBType.airtable: await crud.thing_remoteDelete(thing); break;
      default: await firebase.thing_remoteDelete(thing); break;
    }
  }

  async relationship_remoteCreate(relationship: Relationship) {
    switch (get(dbType)) {
      case DBType.airtable: await crud.relationship_remoteCreate(relationship); break;
      default: await firebase.relationship_remoteCreate(relationship); break;
    }
  }

  async relationship_remoteUpdate(relationship: Relationship) {
    switch (get(dbType)) {
      case DBType.airtable: await crud.relationship_remoteUpdate(relationship); break;
      default: await firebase.relationship_remoteUpdate(relationship); break;
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    switch (get(dbType)) {
      case DBType.airtable: await crud.relationship_remoteDelete(relationship); break;
      default: await firebase.relationship_remoteDelete(relationship); break;
    }
  }

  async relationship_remoteWrite(relationship: Relationship): Promise<void>  {
    return new Promise(async (resolve) => {
      if (!relationship.awaitingCreation) {
        if (relationship.isRemotelyStored) {
          await cloud.relationship_remoteUpdate(relationship);
        } else {
          await cloud.relationship_remoteCreate(relationship);
        }
        resolve();
      }
    })
  }

  // callClassMethod<T extends object, K extends keyof T>(
  //   methodName: K,
  //   parameter: Parameters<T[K]>[0]
  // ) {
  //   switch (T)
  //   const instance = new className();
  //   instance[methodName](parameter);
  // }

  // // Usage
  // callClassMethod(ExampleClass, 'exampleMethod', 'Hello, World!');

}

export const cloud = new Cloud();
