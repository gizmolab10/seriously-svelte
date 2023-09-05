import { debug, dbType, idHere, bulkName, showDetails, idsGrabbed } from '../managers/State';
import { get, DBType, BulkID, PersistID, dbDispatch } from './GlobalImports'

class PersistLocal {
  okayToWrite = false;
  idSeparator = ':';
  separator = '|';

  constructor() {
    // dbType.subscribe((type: string) => {
    //   if (this.okayToWrite) {
    //     const here = dbDispatch.db.hierarchy.here;
    //     if (type) {
    //       this.writeToKeys(PersistID.db, here?.id, type, get(idsGrabbed) ?? []);
    //     }
    //   }
    // });
    idsGrabbed.subscribe((ids: Array<string>) => {
      if (this.okayToWrite) {
        const here = dbDispatch.db.hierarchy.here;
        if (ids && here) {
          const type = dbDispatch.db.dbType;
          this.writeToKeys(PersistID.db, here?.id, type, get(idsGrabbed))
        }
      }
    });
  }

  readFromKey(aKey: string): any | null {
    const storedValue = localStorage.getItem(aKey);
    return storedValue ? JSON.parse(storedValue) : null;
  }

  readFromKeys(aKey: string, bKey: string) {
    let values = this.readFromKey(aKey + this.separator + bKey)?.split(this.separator);
    if (values) {
      values[1] = values[1].split(this.idSeparator);
    }
    console.log('read', values);
    return values;
  }

  writeToKey(aKey: string, value: any) {
    localStorage.setItem(aKey, JSON.stringify(value));
  }

  writeToKeys(aKey: string, aValue: any, bKey: string, bValues: Array<any>) {
    console.log('write', aValue, bValues);
    if (aValue && bValues.length > 0) {
      this.writeToKey(aKey + this.separator + bKey, aValue + this.separator + bValues.join(this.idSeparator));
    }
  }

  setup() {
    localStorage.clear();
    this.writeToKey(PersistID.db, DBType.firebase);
    debug.set(this.readFromKey(PersistID.debug) ?? false);
    showDetails.set(this.readFromKey(PersistID.details) ?? false);
    bulkName.set(this.readFromKey(PersistID.bulk) ?? BulkID.public);
    dbType.set(this.readFromKey(PersistID.db) ?? DBType.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
  }

  setupDBFor(type: string, defaultIDHere: string) {
    const dbValues = this.readFromKeys(PersistID.db, type);
    if (dbValues == null) {
      idHere.set(defaultIDHere);
      idsGrabbed.set([defaultIDHere]);
    } else {
      this.okayToWrite = false;
      idHere.set(dbValues[0]);
      idsGrabbed.set(dbValues[1]);
      this.okayToWrite = true;
    }
  }

}

export const persistLocal = new PersistLocal();
