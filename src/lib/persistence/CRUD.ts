import { Thing, Relationship, hierarchy } from '../common/GlobalImports';
import { thingsArrived } from '../managers/State';
import Airtable from 'airtable';

///////////////////////////////
//                           //
//     users                 //
//     things                //
//     access                //
//     relationships         //
//     predicates            //
//                           //
///////////////////////////////

export default class CRUD {
  base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
  relationships_table = this.base('Relationships');
  predicates_table = this.base('predicates');
  things_table = this.base('Things');
  access_table = this.base('Access');
  users_table = this.base('Users');
  things: Thing[] = [];

  relationships_errorMessage = 'Error in Relationships:';
  things_errorMessage = 'Error in Things:';

  constructor() {}

  setup = async (onCompletion: () => any) => {
    this.readAll(async () => {
      onCompletion();
    });
  }

  readAll = async (onCompletion: () => any) => {
    await this.predicates_readAll();
    await this.relationships_readAll();
    await this.access_readAll();
    await this.users_readAll();
    await this.things_readAll(onCompletion);
  }

  updateAllNeedy = async () => {
    await this.relationships_updateNeedy(); // do this first, in case a relationship points to a thing that needs delete
    await this.things_updateNeedy();
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  async things_readAll(onCompletion: () => any) {
    hierarchy.thingsByID = {}; // clear
    this.things =[];

    try {
      const records = await this.things_table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string);
        hierarchy.thing_remember(thing);
        this.things.push(thing)
      }
      thingsArrived.set(true);
      onCompletion();
    } catch (error) {
      console.log(this.things_errorMessage + ' (things_readAll) ' + error);
    }
  }

  async things_updateNeedy() {
    for (const thing of hierarchy.things) {
      if (thing.needsDelete()) {
        await this.thing_delete(thing)
      } else if (thing.needsCreate()) {
        await this.thing_create(thing)
      } else if (thing.needsSave()) {
        await this.thing_save(thing)
      }
    }
  }

  ////////////////////////////
  //         THING          //
  ////////////////////////////

  async thing_create(thing: Thing) {
    try {
      const fields = await this.things_table.create(thing.fields);
      const id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
      thing.id = id;
      thing.needsCreate(false);
      hierarchy.thingsByID[id] = thing;
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  async thing_save(thing: Thing) {
    try {
      await this.things_table.update(thing.id, thing.fields);
      thing.needsSave(false); // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  thing_delete = async (thing: Thing) => {
    try {
      delete hierarchy.thingsByID[thing.id]; // do first so UX updates quickly
      await this.things_table.destroy(thing.id);
      thing.needsDelete = false;
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  async relationships_readAll() {
    hierarchy.relationships_clearLookups();
    try {
      const records = await this.relationships_table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const predicates = record.fields.predicate as (string[]);
        const predicate = hierarchy.predicatesByID[predicates[0]];
        hierarchy.relationship_new(id, predicate, froms[0], tos[0], order);
      }
    } catch (error) {
      console.log(this.relationships_errorMessage + error);
    }
  }

  async relationships_updateNeedy() {
    for (const relationship of hierarchy.relationships) {
      if (relationship.needsDelete()) {
          await this.relationship_delete(relationship);
      } else if (relationship.needsCreate()) {
          await this.relationship_create(relationship);
      } else if (relationship.needsSave()) {
          await this.relationship_save(relationship);
      }
    };
  }

  ///////////////////////////////////
  //         RELATIONSHIP          //
  ///////////////////////////////////

  async relationship_create(relationship: Relationship | null) {
    if (relationship) {
      try {
        const fields = await this.relationships_table.create(relationship.fields);   // insert with temporary id
        const id = fields['id'];                                                     // grab permanent id
        relationship.id = id;
        relationship.needsCreate(false);
        hierarchy.relationships_refreshLookups();
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

  async relationship_save(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
      relationship.needsSave(false);
    } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
    }
  }

  async relationship_delete(relationship: Relationship | null) {
    if (relationship) {
      try {
        hierarchy.relationships = hierarchy.relationships.filter((item) => item.id !== relationship.id);
        hierarchy.relationships_refreshLookups(); // do first so UX updates quickly
        await this.relationships_table.destroy(relationship.id);
        relationship.needsDelete = false;
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

  /////////////////////////////////////
  //         ANCILLARY DATA          //
  /////////////////////////////////////

  async predicates_readAll() {
    try {
      const records = await this.predicates_table.select().all()

      for (const record of records) {
        const id = record.id as string; // do not yet need this
        const kind = record.fields.kind as string;
        hierarchy.predicate_new(id, kind);
      }

    } catch (error) {
      console.log('Error in predicates:' + error);
    }
  }

  async access_readAll() {
    try {
      const records = await this.access_table.select().all()

      for (const record of records) {
        const id = record.id as string; // do not yet need this
        const kind = record.fields.kind as string;
        hierarchy.access_new(id, kind);
      }

    } catch (error) {
      console.log('Error in Access:' + error);
    }
  }

  async users_readAll() {
    try {
      const records = await this.users_table.select().all()

      for (const record of records) {
        const id = record.id as string; // do not yet need this
        hierarchy.user_new(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
      }

    } catch (error) {
      console.log('Error in Users:' + error);
    }
  }

}

export const crud = new CRUD();