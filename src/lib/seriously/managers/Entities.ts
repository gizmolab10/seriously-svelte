import { signal, SignalKinds } from '../managers/Signals';
import Entity from '../data/Entity';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Entities');

export default class Entities {
  all: Entity[] = [];
  errorMessage = 'Error from Entities database:';

  constructor() {}

  entityFor(id: string | undefined): Entity | undefined {
    if (id == undefined) { return undefined; }
    return this.all.filter((entity) => entity.id === id)[0];
  }


  //////////
  // CRUD //
  //////////

  async readAll() {
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
      console.error(this.errorMessage, error);
    }    
  }

  async update(entity: Entity) {
    try {
      table.update(entity.id, entity.fields);
    } catch (error) {
      console.error(this.errorMessage, error);
    }
  }

  async create(entity: Entity) {
    try {
      table.create(entity);
    } catch (error) {
      console.error(this.errorMessage, error);
    }
  }

  async delete(entity: Entity) {
    try {
      table.delete(entity);
    } catch (error) {
      console.error(this.errorMessage, error);
    }
  }

}

export let entities = new Entities();
