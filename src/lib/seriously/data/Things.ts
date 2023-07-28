import { Thing, relationships, RelationshipKind, constants, hereID, rootID, sortAccordingToOrder } from '../common/GlobalImports';
import Airtable, {FieldSet} from 'airtable';
import { get } from 'svelte/store';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  thingsByID: { [id: string]: Thing } = {};
  root: Thing | null = null;

  constructor() {
    hereID.set(constants.rootID);
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
    return sortAccordingToOrder(array);
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllThings_fromCloud() {
    this.thingsByID = {}; // clear
    // const rootID = constants.rootID;
    // this.root = new Thing(rootID, constants.rootTitle, constants.rootColor, 'r', 0);
    // this.thingsByID[rootID] = this.root;

    try {
      const records = await table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);
        this.thingsByID[id] = thing;
        if (thing.trait == '!') {
          this.root = thing;
          rootID.set(id);
        }
      }

      for (const id in this.thingsByID) {
        const IDofRoot = get(rootID);
        if (IDofRoot != null && IDofRoot != id) {
          relationships.createUniqueRelationship_save_inCloud(RelationshipKind.parent, id, IDofRoot);
        }
      }

      this.root?.becomeHere()
      this.root?.grabOnly()
    } catch (error) {
      console.log(this.errorMessage + ' (readAllThings_fromCloud) ' + error);
    }
  }

  async updateThing_inCloud(thing: Thing) {
    try {
      await table.update(thing.id, thing.fields);
      thing.needsSave = false; // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async updateAllDirtyThings_inCloud() {
    const all: Thing[] = Object.values(this.thingsByID);
    for (const thing of all) {
      if (thing.needsSave) {
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
