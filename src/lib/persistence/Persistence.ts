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
    bulkName.set(BulkIDs.public);
    persistence.writeToKey(PersistenceIDs.db, DBTypes.firebase);
    showDetails.set(this.readFromKey(PersistenceIDs.details) ?? false);
    dbType.set(this.readFromKey(PersistenceIDs.db) ?? DBTypes.firebase); 
  }

}

export const persistence = new Persistence();
