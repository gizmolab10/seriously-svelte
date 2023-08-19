import { DBTypes, BulkIDs, LocalIDs } from '../common/GlobalImports'
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
    showDetails.set(this.readFromKey(LocalIDs.details) ?? false);
    bulkName.set(this.readFromKey(LocalIDs.bulk) ?? BulkIDs.public);
    dbType.set(this.readFromKey(LocalIDs.db) ?? DBTypes.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
  }

}

export const local = new Local();
