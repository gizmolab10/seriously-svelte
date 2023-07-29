import { Thing, get, relationships, RelationshipKind, hereID, sortAccordingToOrder } from '../common/GlobalImports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  thingsByID: { [id: string]: Thing } = {};
  root: Thing | null = null;

  constructor() {}

  get rootID(): (string | null) { return this.root?.id ?? null; };

  thing_ID(id: string | null): Thing | null {
    return (id == null) ? null : this.thingsByID[id];
  }

  things_IDs(ids: Array<string>): Array<Thing> {
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

  async cloud_things_readAll() {
    this.thingsByID = {}; // clear

    try {
      const records = await table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string);
        this.thingsByID[id] = thing;
        if (thing.trait == '!') {
          this.root = thing;
          hereID.set(id);
        }
      }

      for (const id in this.thingsByID) {
        const rootID = this.rootID;
        const thing = things.thing_ID(id);
        if (rootID != null && rootID != id && thing != null) {
          relationships.cloud_relationship_createUnique_insert(RelationshipKind.parent, id, rootID, -1);
          const order = relationships.relationship_firstParent_ID(id)?.order;
          if (thing != null && order != null) {
            thing.order = order;
          }
        }
      }

      this.root?.becomeHere()
      this.root?.grabOnly()
    } catch (error) {
      console.log(this.errorMessage + ' (cloud_things_readAll) ' + error);
    }
  }

  async cloud_thing_insert(thing: Thing) {
    try {
      const fields = await table.create(thing.fields);
      thing.id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
    } catch (error) {
      console.log(this.errorMessage + ' (in create_cloud) ' + error);
    }
  }

  async cloud_thing_save(thing: Thing) {
    try {
      await table.update(thing.id, thing.fields);
      thing.needsSave = false; // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async cloud_things_saveDirty() {
    const all: Thing[] = Object.values(this.thingsByID);
    for (const thing of all) {
      if (thing.needsSave) {
        await this.cloud_thing_save(thing)
      }
    }
  }

  async cloud_thing_delete(thing: Thing) {
    delete(this.thingsByID[thing.id]);
    try {
      await table.destroy(thing.id);
    } catch (error) {
      console.log(this.errorMessage + ' (in delete_cloud) ' + error);
    }
  }

}

export const things = new Things();
