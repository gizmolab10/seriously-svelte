////////////////////////////////////////////////
// abstraction layer: hides CRUD and firebase //
////////////////////////////////////////////////

import { get, Thing, DBTypes, removeAll, Relationship } from '../common/GlobalImports';
import { dbType } from '../managers/State';
import { firebase } from './Firebase';
import { v4 as uuid } from 'uuid';
import { crud } from './CRUD';

export default class Cloud {

  constructor() {}

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

  updateAllNeedy = async () => { 
    switch (get(dbType)) {
      case DBTypes.airtable: await crud.updateAllNeedy(); break;
    }
  }

  setup = (dbType: string, onCompletion: () => any) => {
    switch (dbType) {
      case DBTypes.airtable: crud.setup(onCompletion); break;
      default: firebase.fetchAll(onCompletion); break;
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
