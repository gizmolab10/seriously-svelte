import { Thing, Relationship, RelationshipKind, createCloudID, sortAccordingToOrder } from '../common/GlobalImports';

export default class DataManager {
  relationshipsByFromID: { [id: string]: Array<Relationship> } = {};
  relationshipsByToID: { [id: string]: Array<Relationship> } = {};
  thingsByID: { [id: string]: Thing } = {};
  relationships: Array<Relationship> = [];
  root: Thing | null = null;

  constructor() {}

  get rootID(): (string | null) { return this.root?.id ?? null; };

  thing_ID(id: string | null): Thing | null {
    return (id == null) ? null : this.thingsByID[id];
  }

  things_IDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingsByID[id];
      if (thing != null) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

  relationships_clearLookups() {
    this.relationships = [];
    this.relationshipsByToID = {};
    this.relationshipsByFromID = {};
  }

  relationships_refreshLookups() {
    const saved = this.relationships;
    this.relationships_clearLookups();
    for (const relationship of saved) {
      this.remember(relationship);
    }
  }

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
  
  remember(relationship: Relationship) {
    this.relationships.push(relationship);
    const froms = this.relationshipsByFromID[relationship.from] ?? [];
    froms.push(relationship);
    this.relationshipsByFromID[relationship.from] = froms;
    const tos = this.relationshipsByToID[relationship.to] ?? [];
    tos.push(relationship);
    this.relationshipsByToID[relationship.to] = tos;
  }

  relationship_firstParent_ID(id: string) {
    const thing = this.thing_ID(id);
    const matches = this.relationships_kind(RelationshipKind.parent, false, id);
    if (thing != null && matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  relationships_kind(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
    const dict = to ? this.relationshipsByToID : this.relationshipsByFromID;
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
    return this.things_IDs(ids);
  }

}

export const data = new DataManager();
