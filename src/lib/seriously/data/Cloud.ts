import { hereID, things, Thing, relationships, Relationship, RelationshipKind } from '../common/GlobalImports';
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
    things.thingsByID = {}; // clear

    try {
      const records = await this.things_table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string);
        things.thingsByID[id] = thing;
        if (thing.trait == '!') {
          things.root = thing;
          hereID.set(id);
        }
      }

      for (const id in things.thingsByID) {
        const rootID = things.rootID;
        const thing = things.thing_ID(id);
        if (rootID != null && rootID != id && thing != null) {
          cloud.cloud_relationship_createUnique_insert(RelationshipKind.parent, id, rootID, -1);
          const order = relationships.relationship_firstParent_ID(id)?.order;
          if (thing != null && order != null) {
            thing.order = order;
          }
        }
      }

      things.root?.becomeHere()
      things.root?.grabOnly()
    } catch (error) {
      console.log(this.things_errorMessage + ' (things_readAll) ' + error);
    }
  }

  async cloud_thing_insert(thing: Thing) {
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

  async cloud_thing_save(thing: Thing) {
    try {
      await this.things_table.update(thing.id, thing.fields);
      thing.needsSave = false; // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.things_errorMessage + ' (in updateToCloud) ' + error);
    }
  }

  async things_saveDirty() {
    const all: Thing[] = Object.values(things.thingsByID);
    for (const thing of all) {
      if (thing.needsSave) {
        await this.cloud_thing_save(thing)
      }
    }
  }

  async cloud_thing_delete(thing: Thing) {
    delete(things.thingsByID[thing.id]);
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
    relationships.clearLookups();
    try {
      const records = await this.relationships_table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const kind = record.fields.kind as RelationshipKind;
        const relationship = new Relationship(id, kind, froms[0], tos[0], order);
        relationships.remember(relationship);
      }
    } catch (error) {
      console.log(this.relationships_errorMessage + error);
    }
  }

  async relationships_saveDirty() {
    relationships.all.forEach((relationship) => {
      if (relationship.needsSave) {
          this.cloud_relationship_save(relationship);
      }
    });
  }

  async relationships_thing_deleteAll(thing: Thing) {
    const array = relationships.allByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.cloud_relationship_delete(relationship);
      }
      relationships.refreshLookups();
    }
  }

  async cloud_relationship_save(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
      relationship.needsSave = false;
    } catch (error) {
      alert(this.relationships_errorMessage + error);
    }
  }

  async cloud_relationship_insert(relationship: Relationship | null) {
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

  async cloud_relationship_createUnique_insert(kind: RelationshipKind, from: string, to: string, order: number) {
    await this.cloud_relationship_insert(relationships.relationship_createUnique(kind, from, to, order));
  }

  async cloud_relationship_delete(relationship: Relationship | null, keepInMemory: boolean = false) {
    if (relationship != null) {
      try {
        if (!keepInMemory) {
          relationships.all = relationships.all.filter((item) => item.id !== relationship.id);
          relationships.refreshLookups();
        }
        await this.relationships_table.destroy(relationship.id);
      } catch (error) {
        console.log(this.relationships_errorMessage + error);
      }
    }
  }

}

export const cloud = new Cloud();