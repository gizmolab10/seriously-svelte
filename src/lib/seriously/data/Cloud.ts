import { data, hereID, Thing, Relationship, RelationshipKind } from '../common/GlobalImports';
import Airtable from 'airtable';

export default class Cloud {
  base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
  relationships_errorMessage = 'Error from Relationships database: ';
  things_errorMessage = 'Error from Things database: ';
  relationships_table = this.base('Relationships');  
  things_table = this.base('Things');
  
  constructor() {}

  saveDirty = () => {
    
  }

  readAll = async (onCompletion: () => any) => {
    try {
      await this.relationships_readAll();
    } catch (error) {
      console.log('Error reading Relationships database: ' + error);
    }
    try {
      await this.things_readAll();
      onCompletion();
    } catch (error) {
      console.log('Error reading Things database: ' + error);
    }
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  async things_readAll() {
    data.thingsByID = {}; // clear

    try {
      const records = await this.things_table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string);
        data.thingsByID[id] = thing;
        if (thing.trait == '!') {
          data.root = thing;
          hereID.set(id);
        }
      }

      for (const id in data.thingsByID) {
        const rootID = data.rootID;
        const thing = data.thing_ID(id);
        if (rootID != null && rootID != id && thing != null) {
          cloud.relationship_createUnique_insert(RelationshipKind.parent, id, rootID, -1);
          const order = data.relationship_firstParent_ID(id)?.order;
          if (thing != null && order != null) {
            thing.order = order;
          }
        }
      }

      data.root?.becomeHere()
      data.root?.grabOnly()
    } catch (error) {
      console.log(this.things_errorMessage + ' (things_readAll) ' + error);
    }
  }

  async thing_insert(thing: Thing) {
    try {
      
      const fields = await this.things_table.create(thing.fields);
      const id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
      thing.id = id;
      await this.things_table.destroy(id);
      await this.things_table.create(thing.fields); // re-insert with corrected id
    } catch (error) {
      console.log(this.things_errorMessage + ' (in create_cloud) ' + error);
    }
  }

  async thing_save(thing: Thing) {
    try {
      await this.things_table.update(thing.id, thing.fields);
      thing.needsSave = false; // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.things_errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async things_saveDirty() {
    const all: Thing[] = Object.values(data.thingsByID);
    for (const thing of all) {
      if (thing.needsSave) {
        await this.thing_save(thing)
      }
    }
  }

  async thing_delete(thing: Thing) {
    delete(data.thingsByID[thing.id]);
    try {
      await this.things_table.destroy(thing.id);
    } catch (error) {
      console.log(this.things_errorMessage + ' (in delete_cloud) ' + error);
    }
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  async relationships_readAll() {
    data.relationships_clearLookups();
    try {
      const records = await this.relationships_table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const kind = record.fields.kind as RelationshipKind;
        const relationship = new Relationship(id, kind, froms[0], tos[0], order);
        data.remember(relationship);
      }
    } catch (error) {
      console.log(this.relationships_errorMessage + error);
    }
  }

  async relationships_saveDirty() {
    data.relationships.forEach((relationship) => {
      if (relationship.needsSave) {
          this.relationship_save(relationship);
      }
    });
  }

  async relationships_thing_deleteAll(thing: Thing) {
    const array = data.relationshipsByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.relationship_delete(relationship);
      }
      data.relationships_refreshLookups();
    }
  }

  async relationship_save(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
      relationship.needsSave = false;
    } catch (error) {
      alert(this.relationships_errorMessage + error);
    }
  }

  async relationship_insert(relationship: Relationship | null) {
    if (relationship != null) {
      try {
        const fields = await this.relationships_table.create(relationship.fields);
        const id = fields['id'];
        relationship.id = id;
        await this.relationships_table.destroy(id);
        await this.relationships_table.create(relationship.fields); // re-insert with corrected id
      } catch (error) {
        console.log(this.relationships_errorMessage + error);
      }
    }
  }

  async relationship_createUnique_insert(kind: RelationshipKind, from: string, to: string, order: number) {
    await this.relationship_insert(data.relationship_createUnique(kind, from, to, order));
  }

  async relationship_delete(relationship: Relationship | null, keepInMemory: boolean = false) {
    if (relationship != null) {
      try {
        if (!keepInMemory) {
          data.relationships = data.relationships.filter((item) => item.id !== relationship.id);
          data.relationships_refreshLookups();
        }
        await this.relationships_table.destroy(relationship.id);
      } catch (error) {
        console.log(this.relationships_errorMessage + error);
      }
    }
  }

}

export const cloud = new Cloud();