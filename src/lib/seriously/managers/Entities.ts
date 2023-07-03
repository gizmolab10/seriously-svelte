import { signal, SignalKinds } from '../managers/Signals';
import Entity from '../data/Entity';
import Airtable from 'airtable';

export default class Entities {
  all: Entity[] = [];

  constructor() {}

  async fetchAll() {
    const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');

    try {
      const records = await base('Entities').select().all()

      for (let record of records) {
        let entity = new Entity(record.id, record.fields.title, record.fields.color, record.fields.trait);

        this.addUnique(entity);
      }

      signal([SignalKinds.fetch], null);
    } catch (error) {
      console.error('Error reading Airtable database:', error);
    }    
  }

  entityFor(id: string | undefined): Entity | undefined {
    if (id == undefined) { return undefined; }
    return this.all.filter((entity) => entity.id === id)[0];
  }

  addUnique(entity: Entity) {
    if (!this.all.includes(entity)) {
      this.all.push(entity);
    }
  }
}

export let entities = new Entities();
