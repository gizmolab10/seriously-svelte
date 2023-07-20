import { Thing, Relationship, RelationshipKind, createCloudID } from '../common/Imports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Relationships');

class Relationships {
  relationshipsByToID: { [id: string]: [Relationship] } = {};
  relationshipsByFromID: { [id: string]: [Relationship] } = {};
  errorMessage = 'Error from Relationships database: ';

  constructor() {}

  IDsOfKind(kind: RelationshipKind, matchingTo: boolean, id: string): Array<string> {
    const dict = matchingTo ? this.relationshipsByToID : this.relationshipsByFromID;
    const ids = Array<string>();
    const array = dict[id];
    if (array != null) {
      array.map(
        (relationship) => {
          if (relationship.kind = kind) {
            ids.push(matchingTo ? relationship.from : relationship.to);
          }
        }
      );
    }
    return ids;
  }

  trackRelationship(relationship: Relationship) {
    const froms = this.relationshipsByFromID[relationship.from] ?? [];
    froms.push(relationship);
    this.relationshipsByFromID[relationship.from] = froms;
    const tos = this.relationshipsByToID[relationship.to] ?? [];
    tos.push(relationship);
    this.relationshipsByToID[relationship.to] = tos;
  }

  createAndSaveUniqueRelationshipMaybe(kind: RelationshipKind, from: string, to: string) {
    const array = this.relationshipsByFromID[from];
    if (array == null) {
      let relationship = new Relationship(createCloudID(), kind, from, to);
      this.trackRelationship(relationship);
      this.createRelationshipInCloud(relationship);
    }
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllRelationshipsFromCloud() {
    try {
      const records = await table.select().all()

      for (let record of records) {
        let id = record.fields.id as string;
        let to = record.fields.to as string;
        let from = record.fields.from as string;
        let kind = record.fields.kind as RelationshipKind;
        let relationship = new Relationship(id, kind, from, to);
        this.trackRelationship(relationship);
      }
    } catch (error) {
      alert(this.errorMessage + error);
    }    
  }

  async updateRelationshipToCloud(relationship: Relationship) {
    try {
      table.update(relationship.id, relationship.fields);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async createRelationshipInCloud(relationship: Relationship) {
    try {
      const fields = await table.create(relationship.fields);
      relationship.id = fields['id']; // need for update, delete and relationshipsByFromID
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async deleteRelationshipsFromCloudFor(thing: Thing) {
    const array = this.relationshipsByFromID[thing.id];
    if (array != null) {
      for (let relationship of array) {
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
