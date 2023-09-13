import { debug, dbType, idHere, widgetGap, bulkName, showDetails, idsGrabbed, lineStretch } from '../managers/State';
import { get, DBType, dbDispatch, isServerLocal } from './GlobalImports'

export enum BulkID {
  public = 'Public',
  mine   = 'Jonathan Sand',
}

export enum PersistID {
  lineStretch = 'lineStretch',
  details = 'details',
  debug   = 'debug',
  bulk    = 'bulk',
  here    = 'here',
  grab    = 'grab',
  gap     = 'gap',
  db      = 'db',
}

class PersistLocal {
  okayToWrite = false;
  idSeparator = ':';
  separator = '|';

  constructor() {
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
    return values;
  }

  writeToKey(aKey: string, value: any) {
    localStorage.setItem(aKey, JSON.stringify(value));
  }

  writeToKeys(aKey: string, aValue: any, bKey: string, bValues: Array<any>) {
    if (aValue && bValues.length > 0) {
      this.writeToKey(aKey + this.separator + bKey, aValue + this.separator + bValues.join(this.idSeparator));
    }
  }

  setup() {
    // localStorage.clear();
    const isLocal = isServerLocal();
    this.writeToKey(PersistID.debug, true);
    this.writeToKey(PersistID.gap, 30);
    widgetGap.set(this.readFromKey(PersistID.gap) ?? 30);
    lineStretch.set(this.readFromKey(PersistID.lineStretch) ?? 40);
    debug.set(this.readFromKey(PersistID.debug) ?? isLocal);
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
