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
    return this.all.filter((entity) => entity.entityID === id)[0];
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllFromCloud() {
    try {
      const records = await table.select().all()

      for (const record of records) {
        const entity = new Entity(record.id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);

        if (!this.all.includes(entity)) {
          this.all.push(entity);
        }
      }

      this.assureRootExists();

      signal([SignalKinds.fetch], null);
    } catch (error) {
      alert(this.errorMessage + ' (readAllFromCloud) ' + error);
    }
  }

  async assureRootExists() {
    let foo = this.all;
    console.log('ROOT:', foo);
    return;
    var result = null;
    try {

      result = await table.find('root');
      // const root = new Entity('root', 'root', 'purple', 'r');
      // this.all.push(root);
      // this.createInCloud(root);

    } catch (error) {
      // alert(this.errorMessage + ' (in assureRootExists) ' + error);
    } finally {
      console.log('ROOT:', result);
    }
  }

  async updateToCloud(entity: Entity) {
    try {
      table.update(entity.entityID, entity.fields);
    } catch (error) {
      alert(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async createInCloud(entity: Entity) {
    try {
      const fields = await table.create(entity.fields);
      entity.entityID = fields['id']; // need for updateToCloud
    } catch (error) {
      alert(this.errorMessage + ' (in createInCloud) ' + error);
    }
  }

  async deleteFromCloud(entity: Entity) {
    try {
      table.destroy(entity.entityID);
    } catch (error) {
      alert(this.errorMessage + ' (in deleteFromCloud) ' + error);
    }
  }

}

export const entities = new Entities();
