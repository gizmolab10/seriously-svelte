import { Entity, signal, SignalKinds, seriouslyGlobals } from '../common/Imports';
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
    const root = new Entity('root', seriouslyGlobals.rootTitle, seriouslyGlobals.rootColor, 'r');
    this.all.push(root);

    try {
      const records = await table.select().all()

      for (const record of records) {
        const entity = new Entity(record.id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);

        if (!this.all.includes(entity)) {
          this.all.push(entity);
        }
      }

      signal([SignalKinds.fetch], null);
    } catch (error) {
      alert(this.errorMessage + ' (readAllFromCloud) ' + error);
    }
  }

  async updateToCloud(entity: Entity) {
    try {
      table.update(entity.id, entity.fields);
    } catch (error) {
      alert(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async createInCloud(entity: Entity) {
    try {
      const fields = await table.create(entity.fields);
      entity.id = fields['id']; // need for updateToCloud
    } catch (error) {
      alert(this.errorMessage + ' (in createInCloud) ' + error);
    }
  }

  async deleteFromCloud(entity: Entity) {
    try {
      table.destroy(entity.id);
    } catch (error) {
      alert(this.errorMessage + ' (in deleteFromCloud) ' + error);
    }
  }

}

export const entities = new Entities();
