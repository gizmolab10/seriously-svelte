import { Entity, signal, SignalKinds } from '../common/Imports';
import Airtable, {FieldSet} from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Entities');

export default class Entities {
  errorMessage = 'Error from Entities database: ';
  all: Entity[] = [];

  constructor() {}

  entityFor(id: string | null): Entity | null {
    if (id == null) { return null; }
    return this.all.filter((entity) => entity.id === id)[0];
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllFromCloud() {
    try {
      const records = await table.select().all()

      for (let record of records) {
        let entity = new Entity(record.id, record.fields.title, record.fields.color, record.fields.trait, record.fields.order);

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
      const fields = await table.create(entity.fields);
      entity.id = fields['id']; // need for updateToCloud
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async deleteFromCloud(entity: Entity) {
    try {
      table.destroy(entity.id);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

}

export let entities = new Entities();
