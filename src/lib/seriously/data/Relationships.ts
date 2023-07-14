import { Entity, Relationship, signal, SignalKinds } from '../common/Imports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Relationships');

class Relationships {
  all: Relationship[] = [];
  errorMessage = 'Error from Relationships database: ';

  constructor() {}

  entityFor(id: string | undefined): Entity | undefined {
    if (id == undefined) { return undefined; }
    return this.all.filter((entity) => entity.id === id)[0];
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllFromCloud() {
    try {
      const records = await table.select().all()

      for (let record of records) {
        let entity = new Entity(record.id, record.fields.title, record.fields.color, record.fields.trait);

        if (!this.all.includes(entity)) {
          this.all.push(entity);
        }
      }

      signal([SignalKinds.fetch], null);
    } catch (error) {
      alert(this.errorMessage + error);
    }    
  }

  async updateToCloud(entity: Entity) {
    try {
      table.update(entity.id, entity.fields);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async createInCloud(entity: Entity) {
    try {
      table.create(entity);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async deleteFromCloud(entity: Entity) {
    try {
      table.delete(entity);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

}

export let relationships = new Relationships();
