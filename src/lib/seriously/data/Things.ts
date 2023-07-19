import { Thing, relationships, RelationshipKind, seriouslyGlobals, convertArrayToString } from '../common/Imports';
import Airtable, {FieldSet} from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Things');

export default class Things {
  errorMessage = 'Error from Things database: ';
  root: Thing | null = null;

  constructor() {}

  thingFor(id: string | null): Thing | null {
    if (id == null || this.root == null) { return null; }
    return this.root.traverse((thing) => thing.id == id);
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllThingsFromCloud() {
    const rootID = seriouslyGlobals.rootID;
    const thingsByID: { [id: string]: Thing } = {};
    this.root = new Thing(rootID, seriouslyGlobals.rootTitle, seriouslyGlobals.rootColor, 'm', 0);

    try {
      const records = await table.select().all()
      const to = convertArrayToString([this.root.id]);

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, record.fields.order as number);
        thingsByID[id] = thing;
      }

      for (const id in thingsByID) {
        const child = thingsByID[id];
        const relationship = relationships.relationshipWithFrom(id);
        const parent = thingsByID[relationship?.to ?? 0] ?? this.root; // no id equals 0
        if (relationship == null) {
          relationships.createAndSaveUniqueRelationship(RelationshipKind.parent, id, to);
        }
        parent?.addChild(child);
      }

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
      thing.id = fields['id']; // need for updateToCloud
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
