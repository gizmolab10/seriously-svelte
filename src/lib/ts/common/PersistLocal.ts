import { debug, dbType, bulkName, showDetails } from '../managers/State';
import { DBType, BulkID, PersistID } from './GlobalImports'

class PersistLocal {

  constructor() {}

  writeToKey(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  readFromKey(key: string): any | null {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  }
  
  setup() {
    // this.writeToKey(PersistID.db, DBType.firebase);
    debug.set(this.readFromKey(PersistID.debug) ?? false);
    showDetails.set(this.readFromKey(PersistID.details) ?? false);
    bulkName.set(this.readFromKey(PersistID.bulk) ?? BulkID.public);
    dbType.set(this.readFromKey(PersistID.db) ?? DBType.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
  }

}

export const persistLocal = new PersistLocal();
