import { Thing, reassignOrdersOf, relationships, RelationshipKind, seriouslyGlobals, hereID, signal, SignalKinds } from '../common/GlobalImports';
import Airtable, {FieldSet} from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  thingsByID: { [id: string]: Thing } = {};
  root: Thing | null = null;

  constructor() {
    hereID.set(seriouslyGlobals.rootID);
  }

  thingForID(id: string | null): Thing | null {
    return (id == null || this.root == null) ? null : this.thingsByID[id];
  }

  thingsForIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingsByID[id];
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
    this.thingsByID = {};
    this.thingsByID[rootID] = this.root;

    try {
      const records = await table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);
        this.thingsByID[id] = thing;
      }

      for (const id in this.thingsByID) {
        if (id != rootID) {
          relationships.createAndSaveUniqueRelationshipInCloud(RelationshipKind.parent, id, rootID);
        }
      }

      reassignOrdersOf(this.root.children);
      hereID.set(rootID);
      signal([SignalKinds.relayout], null);
      things.updateThingsInCloud(this.root.children); // do not await this statement, it takes forever !!!
    } catch (error) {
      console.log(this.errorMessage + ' (readAllThingsFromCloud) ' + error);
    }
  }

  async updateThingInCloud(thing: Thing) {
    if (thing.isDirty) {
      try {
        await table.update(thing.id, thing.fields);
        thing.isDirty = false; // if update fails, subsequent update will try again
      } catch (error) {
        console.log(this.errorMessage + ' (in updateToCloud) ' + error);
      }
    }
  }

  async updateThingsInCloud(array: Array<Thing>) {
    try {
      for (const thing of array) {
        await table.update(thing.id, thing.fields);
      }
    } catch (error) {
      console.log(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async createThingInCloud(thing: Thing) {
    try {
      const fields = await table.create(thing.fields);
      thing.id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
    } catch (error) {
      console.log(this.errorMessage + ' (in createInCloud) ' + error);
    }
  }

  async deleteThingFromCloud(thing: Thing) {
    try {
      await table.destroy(thing.id);
    } catch (error) {
      console.log(this.errorMessage + ' (in deleteFromCloud) ' + error);
    }
  }

}

export const things = new Things();
