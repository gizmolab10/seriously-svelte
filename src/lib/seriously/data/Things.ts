import { Thing, relationships, RelationshipKind, seriouslyGlobals, convertArrayToString } from '../common/Imports';
import Airtable, {FieldSet} from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  thingsByID: { [id: string]: Thing } = {};
  root: Thing | null = null;

  constructor() {}

  thingFor(id: string | null): Thing | null {
    return (id == null || this.root == null) ? null : this.thingsByID[id];
  }

  thingsFor(ids: [string]): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingFor(id);
      if (thing != null) {
        array.push(thing);
      }
    }
    return array
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllThingsFromCloud() {
    const rootID = seriouslyGlobals.rootID;
    this.root = new Thing(rootID, seriouslyGlobals.rootTitle, seriouslyGlobals.rootColor, 'm', 0);

    try {
      const records = await table.select().all()
      const parents = convertArrayToString([rootID]); // allow multiple parents ;p

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);
        this.thingsByID[id] = thing;
      }

      for (const id in this.thingsByID) {
        relationships.createAndSaveUniqueRelationshipMaybe(RelationshipKind.parent, id, parents);
      }

      // console.log('ByToID:', relationships.relationshipsByToID[rootID]);
      // console.log('ROOT:', this.root.children);
      console.log('ROOT:', relationships.IDsOfKind(RelationshipKind.parent, true, rootID));

    } catch (error) {
      alert(this.errorMessage + ' (readAllThingsFromCloud) ' + error);
    }
  }

  async updateThingInCloud(thing: Thing) {
    try {
      table.update(thing.id, thing.fields);
    } catch (error) {
      alert(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async createThingInCloud(thing: Thing) {
    try {
      const fields = await table.create(thing.fields);
      thing.id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
    } catch (error) {
      alert(this.errorMessage + ' (in createInCloud) ' + error);
    }
  }

  async deleteThingFromCloud(thing: Thing) {
    try {
      table.destroy(thing.id);
    } catch (error) {
      alert(this.errorMessage + ' (in deleteFromCloud) ' + error);
    }
  }

}

export const things = new Things();
