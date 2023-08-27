import { Thing, hierarchy, Relationship, CreationFlag } from '../common/GlobalImports';
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

export default class RemoteAirtable {
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

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  async things_readAll(onCompletion: () => any) {
    hierarchy.knownTs_byID = {}; // clear
    this.things =[];

    try {
      const records = await this.things_table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = hierarchy.rememberThing_create(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, -1, true);
        this.things.push(thing)
      }
      thingsArrived.set(true);
      onCompletion();
    } catch (error) {
      console.log(this.things_errorMessage + ' (things_readAll) ' + error);
    }
  }


  ////////////////////////////
  //         THING          //
  ////////////////////////////

  async thing_remoteCreate(thing: Thing) {
    try {
      const fields = await this.things_table.create(thing.fields);
      const id = fields['id']; //  // need for update, delete and knownTs_byID (to get parent from relationship)
      thing.id = id;
      thing.isRemotelyStored = true;
      hierarchy.knownTs_byID[id] = thing;
    } catch (error) {
      console.log(this.things_errorMessage + thing.description + error);
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    try {
      await this.things_table.update(thing.id, thing.fields);
    } catch (error) {
      console.log(this.things_errorMessage + thing.description + error);
    }
  }

  thing_remoteDelete = async (thing: Thing) => {
    try {
      delete hierarchy.knownTs_byID[thing.id]; // do first so UX updates quickly
      await this.things_table.destroy(thing.id);
    } catch (error) {
      console.log(this.things_errorMessage + thing.description + error);
    }
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  async relationships_readAll() {
    hierarchy.relationships_clearKnowns();
    try {
      const records = await this.relationships_table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const predicates = record.fields.predicate as (string[]);
        hierarchy.rememberRelationship_remoteCreate(id, predicates[0], froms[0], tos[0], order, CreationFlag.isFromRemote);
      }
    } catch (error) {
      console.log(this.relationships_errorMessage + error);
    }
  }

  ///////////////////////////////////
  //         RELATIONSHIP          //
  ///////////////////////////////////

  async relationship_remoteCreate(relationship: Relationship | null) {
    if (relationship) {
      try {
        const fields = await this.relationships_table.create(relationship.fields);   // insert with temporary id
        const id = fields['id'];                                                     // grab permanent id
        relationship.id = id;
        relationship.isRemotelyStored = true;
        hierarchy.relationships_refreshKnowns();
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

  async relationship_remoteUpdate(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
    } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    try {
      hierarchy.knownRs = hierarchy.knownRs.filter((item) => item.id !== relationship.id);
      hierarchy.relationships_refreshKnowns(); // do first so UX updates quickly
      await this.relationships_table.destroy(relationship.id);
    } catch (error) {
      console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
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
        hierarchy.rememberPredicateCreate(id, kind);
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
        hierarchy.access_create(id, kind);
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
        hierarchy.user_create(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
      }

    } catch (error) {
      console.log('Error in Users:' + error);
    }
  }

}

export const crud = new RemoteAirtable();