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

  createRelationship(kind: RelationshipKind, from: string, to: string, order: number): Relationship {
    const relationship = new Relationship(createCloudID(), kind, from, to, order);
    this.remember(relationship);
    return relationship;
  }

  clearLookups() {
    this.all = [];
    this.allByToID = {};
    this.allByFromID = {};
  }

  reconstruct_lookupDictionaries() {
    const saved = this.all;
    this.clearLookups();
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

  parentRelationshipFor(id: string) {
    const thing = things.thingForID(id);
    const matches = this.relationships_matchingKind(RelationshipKind.parent, false, id);
    if (thing != null && matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  relationships_matchingKind(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
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

  thingsForID(id: string, matchingTo: boolean, kind: RelationshipKind): Array<Thing> {
    const matches = this.relationships_matchingKind(kind, matchingTo, id);
    const ids: Array<string> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        ids.push(matchingTo ? relationship.from : relationship.to);
      }
    }
    return things.thingsForIDs(ids);
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllRelationships_fromCloud() {
    this.clearLookups();
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

  async updateAllDirtyRelationships_inCloud() {
    this.all.forEach((relationship) => {
      if (relationship.needsSave) {
          this.updateRelationship_inCloud(relationship);
      }
    });
  }

  async updateRelationship_inCloud(relationship: Relationship) {
    try {
      table.update(relationship.id, relationship.fields);
      relationship.needsSave = false;
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async saveRelationship_toCloud(relationship: Relationship | null) {
    const rootID = things.rootID;
    if (relationship != null && rootID != null && relationship.to != rootID) {
      try {
        const fields = await table.create(relationship.fields);
        relationship.id = fields['id'];
      } catch (error) {
        console.log(this.errorMessage + error);
      }
    }
  }

  createUniqueRelationship(kind: RelationshipKind, from: string, to: string, order: number) {
    if (this.parentRelationshipFor(from) == null) {
      const relationship = this.createRelationship(kind, from, to, order);
      relationship.needsSave = true;
      return relationship;
    }

    return null;
  }

  async createUniqueRelationship_saveInCloud(kind: RelationshipKind, from: string, to: string, order: number) {
    await this.saveRelationship_toCloud(this.createUniqueRelationship(kind, from, to, order));
  }

  async deleteRelationships_updateCloudFor(thing: Thing) {
    const array = this.allByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.deleteRelationship_fromCloud(relationship);
      }
      this.reconstruct_lookupDictionaries();
    }
  }

  async deleteRelationship_fromCloud(relationship: Relationship | null, keepInMemory: boolean = false) {
    if (relationship != null) {
      try {
        if (!keepInMemory) {
          this.all = this.all.filter((item) => item.id !== relationship.id);
        }
        await table.destroy(relationship.id);
      } catch (error) {
        console.log(this.errorMessage + error);
      }
    }
  }

}

export const relationships = new Relationships();
