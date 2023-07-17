import { Relationship, signal, SignalKinds } from '../common/Imports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Relationships');

class Relationships {
  all: Relationship[] = [];
  errorMessage = 'Error from Relationships database: ';

  constructor() {}

  entityFor(id: string | null): Relationship | null {
    if (id == null) { return null; }
    return this.all.filter((relationship) => relationship.id === id)[0];
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllFromCloud() {
    try {
      const records = await table.select().all()

      for (let record of records) {
        let relationship = new Relationship(record.id, record.fields.title, record.fields.color, record.fields.trait);

        if (!this.all.includes(relationship)) {
          this.all.push(relationship);
        }
      }

      signal([SignalKinds.fetch], null);
    } catch (error) {
      alert(this.errorMessage + error);
    }    
  }

  async updateToCloud(relationship: Relationship) {
    try {
      table.update(relationship.id, relationship.fields);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async createInCloud(relationship: Relationship) {
    try {
      table.create(relationship);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async deleteFromCloud(thing: Relationship) {
    try {
      table.delete(thing);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

}

export const relationships = new Relationships();
