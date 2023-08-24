import { get, Thing, DBTypes, removeAll, hierarchy, Relationship, normalizeOrderOf } from '../common/GlobalImports';
import { dbType, isBusy, thingsArrived } from '../managers/State';
import { firebase } from './Firebase';
import { v4 as uuid } from 'uuid';
import { crud } from './CRUD';

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
          this.setup(type, () => {
            // this will happen when persistence sets dbType !!! too early?
            hierarchy.hierarchy_construct();
            const root = hierarchy.root;
            this.hasDataForDBType[type] = true;
            if (root) {
              normalizeOrderOf(root.children)
              root.grabOnly()
            }
            thingsArrived.set(true);
            isBusy.set(false);
          })
        }
      }
    })
  }

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

  setup = (dbType: string, onCompletion: () => any) => {
    switch (dbType) {
      case DBTypes.airtable: crud.setup(onCompletion); break;
      default: firebase.setup(onCompletion); break;
    }
  }

  resetRootFor = (dbType: string) => {
    switch (dbType) {
      case DBTypes.airtable: hierarchy.resetRootFrom(crud.things); break;
    }
  }

  handleAllNeeds = async () => { 
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.handleAllNeeds(); break;
      default: await firebase.handleAllNeeds(); break;
    }
  }

  thing_remoteCreate = async (thing: Thing) => { 
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.thing_remoteCreate(thing); break;
      default: await firebase.thing_remoteCreate(thing);
    }
  }

  thing_remoteUpdate = async (thing: Thing) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.thing_remoteUpdate(thing); break;
      default: await firebase.thing_remoteUpdate(thing); break;
    }
  }

  thing_remoteDelete = async (thing: Thing) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.thing_remoteDelete(thing); break;
      default: await firebase.thing_remoteDelete(thing); break;
    }
  }

  relationship_remoteDelete = async (relationship: Relationship) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.relationship_remoteDelete(relationship); break;
      default: await firebase.relationship_remoteDelete(relationship); break;
    }
  }

  relationship_remoteCreate = async (relationship: Relationship) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.relationship_remoteCreate(relationship); break;
      default: await firebase.relationship_remoteCreate(relationship); break;
    }
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
