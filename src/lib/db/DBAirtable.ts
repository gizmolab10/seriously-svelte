import { Thing, Hierarchy, Relationship, CreationFlag } from '../common/GlobalImports';
import { thingsArrived } from '../managers/State';
import DBInterface from './DBInterface';
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

export default class DBAirtable implements DBInterface {
  base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
  relationships_table = this.base('Relationships');
  predicates_table = this.base('predicates');
  things_table = this.base('Things');
  access_table = this.base('Access');
  users_table = this.base('Users');
  _hierarchy: Hierarchy | null = null;
  things: Thing[] = [];
  hasData = false;

  relationships_errorMessage = 'Error in Relationships:';
  things_errorMessage = 'Error in Things:';

  async setup() { await this.readAll(); }

  get hierarchy(): Hierarchy { 
    if (this._hierarchy == null) {
      this._hierarchy = new Hierarchy();
    }
    return this._hierarchy!;
  }

  async readAll() {
    await this.predicates_readAll();
    await this.relationships_readAll();
    await this.access_readAll();
    await this.users_readAll();
    this.things_readAll()
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  async things_readAll() {
    this.hierarchy.knownT_byID = {}; // clear
    this.things =[];

    try {
      const records = await this.things_table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = this.hierarchy.rememberThing_runtimeCreate(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string, -1, true);
        this.things.push(thing)
      }
      thingsArrived.set(true);
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
      this.hierarchy.knownT_byID[id] = thing;
    } catch (error) {
      thing.log(this.things_errorMessage + error);
    }
  }

  async thing_remoteUpdate(thing: Thing) {
    try {
      await this.things_table.update(thing.id, thing.fields);
    } catch (error) {
      thing.log(this.things_errorMessage + error);
    }
  }

  async thing_remoteDelete(thing: Thing) {
    try {
      delete this.hierarchy.knownT_byID[thing.id]; // do first so UX updates quickly
      await this.things_table.destroy(thing.id);
    } catch (error) {
      thing.log(this.things_errorMessage + error);
    }
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  async relationships_readAll() {
    this.hierarchy.relationships_clearKnowns();
    try {
      const records = await this.relationships_table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const predicates = record.fields.predicate as (string[]);
        await this.hierarchy.rememberRelationship_remoteCreate(id, predicates[0], froms[0], tos[0], order, CreationFlag.isFromRemote);
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
        this.hierarchy.relationships_refreshKnowns();
      } catch (error) {
        relationship.log(this.relationships_errorMessage + error);
      }
    }
  }

  async relationship_remoteUpdate(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
    } catch (error) {
        relationship.log(this.relationships_errorMessage + error);
    }
  }

  async relationship_remoteDelete(relationship: Relationship) {
    try {
      this.hierarchy.knownRs = this.hierarchy.knownRs.filter((relationship: Relationship) => relationship.id !== relationship.id);
      this.hierarchy.relationships_refreshKnowns(); // do first so UX updates quickly
      await this.relationships_table.destroy(relationship.id);
    } catch (error) {
      relationship.log(this.relationships_errorMessage + error);
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
        this.hierarchy.rememberPredicate_runtimeCreate(id, kind);
      }

    } catch (error) {
      console.log('Error in Predicates:' + error);
    }
  }

  async access_readAll() {
    try {
      const records = await this.access_table.select().all()

      for (const record of records) {
        const id = record.id as string; // do not yet need this
        const kind = record.fields.kind as string;
        this.hierarchy.access_runtimeCreate(id, kind);
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
        this.hierarchy.user_runtimeCreate(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
      }

    } catch (error) {
      console.log('Error in Users:' + error);
    }
  }

}

export const dbAirtable = new DBAirtable();