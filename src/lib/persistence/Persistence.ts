import { DBTypes, PersistenceIDs } from '../common/GlobalImports'
import { dbType, showDetails } from '../managers/State';

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
    dbType.set(this.readFromKey(PersistenceIDs.db) ?? DBTypes.airtable);
    console.log(showDetails, dbType);
  }

}

export const persistence = new Persistence();
