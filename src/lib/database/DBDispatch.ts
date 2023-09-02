import { DBType, removeAll, hierarchy } from '../common/GlobalImports';
import { dbType, isBusy, thingsArrived } from '../managers/State';
import { dbFirebase } from './DBFirebase';
import { dbAirtable } from './DBAirtable';
import DBInterface from './DBInterface';
import { v4 as uuid } from 'uuid';

////////////////////////////////////////////////
// abstraction layer: hides CRUD and firebase //
////////////////////////////////////////////////

export default class DBDispatch {
  db: DBInterface;

  constructor() {
    this.db = dbFirebase;
    dbType.subscribe((type: string) => {
      if (type) {
        if (this.db.hasData) {
          this.db.resetRoot();
        } else {
          isBusy.set(true);         // also used by Details radio buttons
          thingsArrived.set(false);
          (async () => {            // this will happen when Local sets dbType !!! too early?
            switch (type) {
              case DBType.airtable: await dbAirtable.setup(); break;
              case DBType.firebase: await dbFirebase.setup(); break;
            };
            hierarchy.constructHierarchy(type);
          })();
          
        }
      }
    })
  }

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid
}

export const dbDispatch = new DBDispatch();
