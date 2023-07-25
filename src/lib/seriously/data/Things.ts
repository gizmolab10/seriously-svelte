import { Thing, relationships, RelationshipKind, seriouslyGlobals, hereID, signal, Signals } from '../common/GlobalImports';
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
    if (Array.isArray(array)) {
      array.sort((a: Thing, b: Thing) => { return a.order - b.order })
    }
    return array
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllThings_fromCloud() {
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
          relationships.createRelationship_save_inCloud(RelationshipKind.parent, id, rootID);
        }
      }

      this.root.becomeHere()
      this.root.grabOnly()
    } catch (error) {
      console.log(this.errorMessage + ' (readAllThings_fromCloud) ' + error);
    }
  }

  async updateThing_inCloud(thing: Thing) {
    try {
      await table.update(thing.id, thing.fields);
      thing.isDirty = false; // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async updateAllDirtyThings_inCloud() {
    const all: Thing[] = Object.values(this.thingsByID);
    for (const thing of all) {
      if (thing.isDirty) {
        await this.updateThing_inCloud(thing)
      }
    }
  }

  async createThing_inCloud(thing: Thing) {
    try {
      const fields = await table.create(thing.fields);
      thing.id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
    } catch (error) {
      console.log(this.errorMessage + ' (in create_inCloud) ' + error);
    }
  }

  async deleteThing_updateCloud(thing: Thing) {
    delete(this.thingsByID[thing.id]);
    try {
      await table.destroy(thing.id);
    } catch (error) {
      console.log(this.errorMessage + ' (in delete_fromCloud) ' + error);
    }
  }

}

export const things = new Things();
