import { DBType, BulkID, LocalID } from './GlobalImports'
import { dbType, bulkName, showDetails } from '../managers/State';

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
    showDetails.set(this.readFromKey(LocalID.details) ?? false);
    bulkName.set(this.readFromKey(LocalID.bulk) ?? BulkID.public);
    dbType.set(this.readFromKey(LocalID.db) ?? DBType.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
  }

}

export const local = new Local();
