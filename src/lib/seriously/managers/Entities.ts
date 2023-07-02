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

  has(entity: Entity) {
    for (let one of this.all) {
      if (one.id == entity.id) {
        return true;
      }
    }

    return false;
  }

  addUnique(entity: Entity) {
    if (!this.has(entity)) {
      this.all.push(entity);
    }
  }
}

export let entities = new Entities();
