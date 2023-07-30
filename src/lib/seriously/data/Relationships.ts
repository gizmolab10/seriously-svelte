import { Thing, things, Relationship, RelationshipKind, createCloudID, constants } from '../common/GlobalImports';\

class Relationships {
  all: Array<Relationship> = [];
  allByToID: { [id: string]: Array<Relationship> } = {};
  allByFromID: { [id: string]: Array<Relationship> } = {};

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

}

export const relationships = new Relationships();
