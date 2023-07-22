import { Thing, things, Relationship, RelationshipKind, createCloudID } from '../common/GlobalImports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Relationships');

class Relationships {
  all: Array<Relationship> = [];
  allByToID: { [id: string]: Array<Relationship> } = {};
  allByFromID: { [id: string]: Array<Relationship> } = {};
  errorMessage = 'Error from Relationships database: ';

  constructor() {}

  createRelationship(kind: RelationshipKind, from: string, to: string): Relationship {
    const relationship = new Relationship(createCloudID(), kind, from, to);
    this.remember(relationship);
    return relationship;
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

  relationshipsMatchingKind(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
    const dict = to ? this.allByToID : this.allByFromID;
    const matches = dict[id] as Array<Relationship>;
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
    const matches = this.relationshipsMatchingKind(kind, matchingTo, id);
    const ids: Array<string> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        ids.push(matchingTo ? relationship.from : relationship.to);
      }
    }
    const array = things.thingsForIDs(ids);
    if (Array.isArray(array)) {
      array.sort((a: Thing, b: Thing) => {
        return a.order - b.order
      })
    }
    return array;
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllRelationshipsFromCloud() {
    try {
      const records = await table.select().all()

      for (const record of records) {
        const id = record.fields.id as string;
        const to = record.fields.to as string;
        const from = record.fields.from as string;
        const kind = record.fields.kind as RelationshipKind;
        const relationship = new Relationship(id, kind, from, to);
        this.remember(relationship);
      }
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async updateDirtyRelationshipsToCloud() {
    this.all.forEach((relationship) => {
      if (relationship.isDirty) {
        try {
          this.updateRelationshipToCloud(relationship);
        } catch (error) {
          alert(this.errorMessage + error);
        }
      }
    });
  }

  async updateRelationshipToCloud(relationship: Relationship) {
    try {
      table.update(relationship.id, relationship.fields);
      relationship.isDirty = false;
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async createRelationshipInCloud(relationship: Relationship) {
    try {
      const fields = await table.create(relationship.fields);
      relationship.id = fields['id'];
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async deleteRelationshipsFromCloudFor(thing: Thing) {
    const array = this.allByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.deleteRelationshipFromCloud(relationship);
      }
    }
  }

  async deleteRelationshipFromCloud(relationship: Relationship | null) {
    if (relationship != null) {
      try {
        await table.destroy(relationship.id);
      } catch (error) {
        alert(this.errorMessage + error);
      }
    }
  }

}

export const relationships = new Relationships();
