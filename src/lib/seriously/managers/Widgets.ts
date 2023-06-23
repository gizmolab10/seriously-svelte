import Widget from "../seriously/Widget.svelte";
import Airtable from 'airtable';
import Idea from "../data/Ideas";

export default class Widgets {
  all = [];

  constructor() {
    const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');

    try {
      const records = await base('Ideas').select().all()
      for (let record of records) {
        let idea = new Idea(record.id, record.fields.title, record.fields.color, record.fields.trait);
        ideas.push(idea);
      }
      isLoading = false;
    } catch (error) {
      console.error('Error reading Airtable database:', error);
    }
  }
}

const widgets = new Widgets();
