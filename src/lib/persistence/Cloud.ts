////////////////////////////////////////////////
// abstraction layer: hides CRUD and firebase //
////////////////////////////////////////////////

import { get, Thing, DBTypes, removeAll, hierarchy, Relationship } from '../common/GlobalImports';
import { dbType, isBusy, thingsArrived } from '../managers/State';
import { firebase } from './Firebase';
import { v4 as uuid } from 'uuid';
import { crud } from './CRUD';

export default class Cloud {
  hasDataForDBType: { [type: string]: boolean } = {};

  constructor() {
    dbType.subscribe((type: string) => {
      if (type) {
        this.setup(type, () => {
          // this will happen when persistence sets dbType !!! too early?
          hierarchy.hierarchy_construct();
          this.hasDataForDBType[type] = true;
          thingsArrived.set(true);
          isBusy.set(false);
        })
      }
    })
  }

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

  setup = (dbType: string, onCompletion: () => any) => {
    switch (dbType) {
      case DBTypes.airtable: crud.setup(onCompletion); break;
      default: firebase.fetchAll(onCompletion); break;
    }
  }

  updateAllNeedy = async () => { 
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.updateAllNeedy(); break;
    }
  }

  thing_create = async (thing: Thing) => { 
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.thing_create(thing); break;
    }
  }

  thing_save = async (thing: Thing) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.thing_save(thing); break;
    }
  }

  thing_delete = async (thing: Thing) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.thing_delete(thing); break;
    }
  }

  relationship_delete = async (relationship: Relationship | null) => {
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.relationship_delete(relationship); break;
    }
  }

}

export const cloud = new Cloud();
