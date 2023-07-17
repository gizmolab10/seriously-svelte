import { Thing, signal, SignalKinds, seriouslyGlobals } from '../common/Imports';
import Airtable, {FieldSet} from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  all: Thing[] = [];

  constructor() {}

  thingFor(id: string | null): Thing | null {
    if (id == null) { return null; }
    return this.all.filter((thing) => thing.id === id)[0];
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllFromCloud() {
    let main = new Thing('main', seriouslyGlobals.mainThingTitle, seriouslyGlobals.mainThingColor, 'm', 0);
    this.all.push(main);

    try {
      const records = await table.select().all()

      for (const record of records) {
        const thing = new Thing(record.id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);

        if (!this.all.includes(thing)) {
          this.all.push(thing);
        }
      }

      signal([SignalKinds.fetch], null);
    } catch (error) {
      alert(this.errorMessage + ' (readAllFromCloud) ' + error);
    }
  }

  async updateToCloud(thing: Thing) {
    try {
      table.update(thing.id, thing.fields);
    } catch (error) {
      alert(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async createInCloud(thing: Thing) {
    try {
      const fields = await table.create(thing.fields);
      thing.id = fields['id']; // need for updateToCloud
    } catch (error) {
      alert(this.errorMessage + ' (in createInCloud) ' + error);
    }
  }

  async deleteFromCloud(thing: Thing) {
    try {
      table.destroy(thing.id);
    } catch (error) {
      alert(this.errorMessage + ' (in deleteFromCloud) ' + error);
    }
  }

}

export const things = new Things();
