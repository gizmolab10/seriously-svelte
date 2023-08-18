import { DBTypes, BulkIDs, PersistenceIDs } from '../common/GlobalImports'
import { dbType, bulkName, showDetails } from '../managers/State';

class Persistence {

  constructor() {}

  writeToKey(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  readFromKey(key: string): any | null {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  }
  
  setup() {
    showDetails.set(this.readFromKey(PersistenceIDs.details) ?? false);
    bulkName.set(this.readFromKey(PersistenceIDs.bulk) ?? BulkIDs.public);
    dbType.set(this.readFromKey(PersistenceIDs.db) ?? DBTypes.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
  }

}

export const persistence = new Persistence();
