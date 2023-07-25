import { Thing, things, Relationship, RelationshipKind, createCloudID, seriouslyGlobals } from '../common/GlobalImports';
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

  clearLookups() {
    this.all = [];
    this.allByToID = {};
    this.allByFromID = {};
  }

  refreshLookups() {
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

  relationshipsMatchingKind(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
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
    const matches = this.relationshipsMatchingKind(kind, matchingTo, id);
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
        const kind = record.fields.kind as RelationshipKind;
        const froms = record.fields.from as (string[]);
        const tos = record.fields.to as (string[]) ?? [seriouslyGlobals.rootID]; // relationships that have no to point at root
        const relationship = new Relationship(id, kind, froms[0], tos[0]);
        this.remember(relationship);
        console.log(froms[0]);
      }
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async updateAllDirtyRelationshipsToCloud() {
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

  async createRelationship_inCloud(relationship: Relationship) {
    try {
      const fields = await table.create(relationship.fields);
      relationship.id = fields['id'];
    } catch (error) {
      alert(this.errorMessage + error);
    }
  }

  async createRelationship_save_inCloud(kind: RelationshipKind, from: string, to: string) {
    if (this.relationshipsMatchingKind(kind, false, from).length == 0) {
      await this.createRelationship_inCloud(this.createRelationship(kind, from, to))
    }
  }

  async deleteRelationships_updateCloudFor(thing: Thing) {
    const array = this.allByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.deleteRelationship_fromCloud(relationship);
        this.all = this.all.filter((item) => item.id !== relationship.id);
      }
      this.refreshLookups();
    }

  }

  private async deleteRelationship_fromCloud(relationship: Relationship | null) {
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
