import { signalFetchCompleted } from './Signals';
import Idea from '../data/Idea';
import Airtable from 'airtable';

export default class Ideas {
  all: Idea[] = [];

  constructor() {}

  async fetchAll() {
    const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');

    try {
      const records = await base('Ideas').select().all()

      for (let record of records) {
        let idea = new Idea(record.id, record.fields.title, record.fields.color, record.fields.trait);

        this.addUnique(idea);
      }

      signalFetchCompleted('got em!');
    } catch (error) {
      console.error('Error reading Airtable database:', error);
    }    
  }

  has(idea: Idea) {
    for (let one of this.all) {
      if (one.id == idea.id) {
        return true;
      }
    }

    return false;
  }

  addUnique(idea: Idea) {
    if (!this.has(idea)) {
      this.all.push(idea);
    }
  }
}

export let ideas = new Ideas();
