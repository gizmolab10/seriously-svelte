import { Thing, relationships, RelationshipKind, seriouslyGlobals, convertToString } from '../common/Imports';
import Airtable, {FieldSet} from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  main: Thing | null = null;

  constructor() {}

  thingFor(id: string | null): Thing | null {
    if (id == null || this.main == null) { return null; }
    return this.main!.traverse((thing) => thing.id === id);
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllThingsFromCloud() {
    this.main = new Thing('main', seriouslyGlobals.mainThingTitle, seriouslyGlobals.mainThingColor, 'm', 0);

    try {
      const records = await table.select().all()
      const to = convertToString([this.main.id] as [string]);

      for (const record of records) {
        const thing = new Thing(record.id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);

        if (!this.main.children.includes(thing)) {
          this.main.children.push(thing);
          thing.parents.push(this.main);
          relationships.createAndSaveUniqueRelationship(RelationshipKind.parent, thing.id, to);
        }
      }
    } catch (error) {
      alert(this.errorMessage + ' (readAllThingsFromCloud) ' + error);
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
