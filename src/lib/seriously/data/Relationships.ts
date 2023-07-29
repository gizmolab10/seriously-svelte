import { Thing, things, Relationship, RelationshipKind, createCloudID, constants } from '../common/GlobalImports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Relationships');

class Relationships {
  all: Array<Relationship> = [];
  allByToID: { [id: string]: Array<Relationship> } = {};
  allByFromID: { [id: string]: Array<Relationship> } = {};
  errorMessage = 'Error from Relationships database: ';

  constructor() {}

  relationship_create(kind: RelationshipKind, from: string, to: string, order: number): Relationship {
    const relationship = new Relationship(createCloudID(), kind, from, to, order);
    this.remember(relationship);
    return relationship;
  }

  relationship_createUnique(kind: RelationshipKind, from: string, to: string, order: number) {
    if (this.relationship_firstParent_ID(from) == null) {
      const relationship = this.relationship_create(kind, from, to, order);
      relationship.needsSave = true;
      return relationship;
    }

    return null;
  }

  clearLookup() {
    this.all = [];
    this.allByToID = {};
    this.allByFromID = {};
  }

  refreshLookup() {
    const saved = this.all;
    this.clearLookup();
    for (const relationship of saved) {
      this.remember(relationship);
    }
  }
  
  remember(relationship: Relationship) {
    this.all.push(relationship);
    const froms = this.allByFromID[relationship.from] ?? [];
    froms.push(relationship);
    this.allByFromID[relationship.from] = froms;
    const tos = this.allByToID[relationship.to] ?? [];
    tos.push(relationship);
    this.allByToID[relationship.to] = tos;
  }

  relationship_firstParent_ID(id: string) {
    const thing = things.thing_ID(id);
    const matches = this.relationships_kind(RelationshipKind.parent, false, id);
    if (thing != null && matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  relationships_kind(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
    const dict = to ? this.allByToID : this.allByFromID;
    const matches = dict[id] as Array<Relationship>; // filter out baaaaad values
    const array: Array<Relationship> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        if (relationship.kind == kind) {
          array.push(relationship);
        }
      }
    }
    return array;
  }

  things_kind_ID(kind: RelationshipKind, id: string, matchingTo: boolean): Array<Thing> {
    const matches = this.relationships_kind(kind, matchingTo, id);
    const ids: Array<string> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        ids.push(matchingTo ? relationship.from : relationship.to);
      }
    }
    return things.things_IDs(ids);
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async cloud_relationships_readAll() {
    this.clearLookup();
    try {
      const records = await table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const kind = record.fields.kind as RelationshipKind;
        const relationship = new Relationship(id, kind, froms[0], tos[0], order);
        this.remember(relationship);
      }
    } catch (error) {
      console.log(this.errorMessage + error);
    }
  }

  async cloud_relationships_saveDirty() {
    this.all.forEach((relationship) => {
      if (relationship.needsSave) {
          this.cloud_relationship_save(relationship);
      }
    });
  }

  async cloud_relationship_save(relationship: Relationship) {
    try {
      table.update(relationship.id, relationship.fields);
      relationship.needsSave = false;
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async cloud_relationship_insert(relationship: Relationship | null) {
    const rootID = things.rootID;
    if (relationship != null && rootID != null && relationship.to != rootID) {
      try {
        alert('SAVE  ' + relationship.id);
        const fields = await table.create(relationship.fields);
        relationship.id = fields['id'];
      } catch (error) {
        console.log(this.errorMessage + error);
      }
    }
  }

  async cloud_relationship_createUnique_insert(kind: RelationshipKind, from: string, to: string, order: number) {
    await this.cloud_relationship_insert(this.relationship_createUnique(kind, from, to, order));
  }

  async cloud_relationships_deleteAll_thing(thing: Thing) {
    const array = this.allByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.cloud_relationships_deleteAll(relationship);
      }
      this.refreshLookup();
    }
  }

  async cloud_relationships_deleteAll(relationship: Relationship | null, keepInMemory: boolean = false) {
    if (relationship != null) {
      try {
        if (!keepInMemory) {
          this.all = this.all.filter((item) => item.id !== relationship.id);
          this.refreshLookup();
        }
        await table.destroy(relationship.id);
      } catch (error) {
        console.log(this.errorMessage + error);
      }
    }
  }

}

export const relationships = new Relationships();
