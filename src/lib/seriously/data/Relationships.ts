import { Relationship, RelationshipKind, createCloudID } from '../common/Imports';
import Airtable from 'airtable';

const base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
const table = base('Relationships');

class Relationships {
  all: Relationship[] = [];
  errorMessage = 'Error from Relationships database: ';

  constructor() {}

  relationshipFrom(id: string | null): Relationship | null {
    if (id == null) { return null; }
    return this.all.filter((relationship) => relationship.from == id)[0];
  }

  createAndSaveUniqueRelationship(kind: RelationshipKind, from: string, to: string) {
    if (this.relationshipFrom(from) == null) {
      console.log('PARENT:', from);
      let relationship = new Relationship(createCloudID(), kind, from, to);
      this.all.push(relationship);
      this.createInCloud(relationship);
    }
  }

  ///////////////////////////
  //         CRUD          //
  ///////////////////////////

  async readAllRelationshipsFromCloud() {
    try {
      const records = await table.select().all()

      console.log(records);

      for (let record of records) {
        let id = record.fields.id as string;
        let to = record.fields.to as string;
        let from = record.fields.from as string;
        let kind = record.fields.kind as RelationshipKind;
        let relationship = new Relationship(id, kind, from, to);

        if (!this.all.includes(relationship)) {
          this.all.push(relationship);
        }
      }
      console.log(this.all);
    } catch (error) {
      alert(this.errorMessage + error);
    }    
  }

  async updateToCloud(relationship: Relationship) {
    try {
      table.update(relationship.id, relationship.fields);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async createInCloud(relationship: Relationship) {
    try {
      table.create(relationship.fields);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async deleteFromCloud(relationship: Relationship) {
    try {
      table.destroy(relationship.id);
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

}

export const relationships = new Relationships();
