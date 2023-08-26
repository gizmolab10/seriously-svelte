import { debug, dbType, bulkName, showDetails } from '../managers/State';
import { DBType, BulkID, LocalID } from './GlobalImports'

class Local {

  constructor() {}

  writeToKey(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  readFromKey(key: string): any | null {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  }
  
  setup() {
    this.writeToKey(LocalID.debug, false);
    // this.writeToKey(LocalID.db, DBType.airtable);
    debug.set(this.readFromKey(LocalID.debug) ?? false);
    showDetails.set(this.readFromKey(LocalID.details) ?? false);
    bulkName.set(this.readFromKey(LocalID.bulk) ?? BulkID.public);
    dbType.set(this.readFromKey(LocalID.db) ?? DBType.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
  }

}

export const local = new Local();
