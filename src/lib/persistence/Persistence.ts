import { dbType, showDetails } from '../managers/State';
import { DBTypes } from '../common/GlobalImports'

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
    showDetails.set(this.readFromKey('details') ?? false);
    dbType.set(this.readFromKey('db') ?? DBTypes.airtable);
  }

}

export const persistence = new Persistence();
