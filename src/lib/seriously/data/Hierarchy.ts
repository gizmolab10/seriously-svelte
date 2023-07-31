import { get, grabbedID, grabbedIDs, cloud, Thing, Relationship, RelationshipKind, sortAccordingToOrder } from '../common/GlobalImports';

////////////////////////////////////////
// creation, tracking and destruction //
//    of things and relationships     //
////////////////////////////////////////

export default class Hierarchy {
  relationshipsByFromID: { [id: string]: Array<Relationship> } = {};
  relationshipsByToID: { [id: string]: Array<Relationship> } = {};
  thingsByID: { [id: string]: Thing } = {};
  relationships: Array<Relationship> = [];
  root: Thing | null = null;
  here: Thing | null = null;

  constructor() {}

  get rootID(): (string | null) { return this.root?.id ?? null; };
  get grabbedThing(): (Thing | null) { return this.thing_byID(get(grabbedID)) }

  highestGrab(up: boolean) {
    const ids = get(grabbedIDs);
    let grabs = hierarchy.things_byIDs(ids);
    sortAccordingToOrder(grabs);
    if (up) {
      return grabs[0];
    } else {
      return grabs[grabs.length - 1];
    }
  }

  thing_byID(id: string | null): Thing | null {
    return (id == null) ? null : this.thingsByID[id];
  }

  things_byIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingsByID[id];
      if (thing != null) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

  things_byKind_andID(kind: RelationshipKind, id: string, matchingTo: boolean): Array<Thing> {
    const matches = this.relationships_byKind(kind, matchingTo, id);
    const ids: Array<string> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        ids.push(matchingTo ? relationship.from : relationship.to);
      }
    }
    return this.things_byIDs(ids);
  }

  relationship_create(kind: RelationshipKind, from: string, to: string, order: number): Relationship {
    const relationship = new Relationship(cloud.newCloudID, kind, from, to, order);
    this.relationship_remember(relationship);
    return relationship;
  }

  relationship_createUnique(kind: RelationshipKind, from: string, to: string, order: number) {
    if (this.relationship_firstParent_byID(from) == null) {
      const relationship = this.relationship_create(kind, from, to, order);
      relationship.needsSave = true;
      return relationship;
    }

    return null;
  }
  
  relationship_remember(relationship: Relationship) {
    this.relationships.push(relationship);
    const froms = this.relationshipsByFromID[relationship.from] ?? [];
    froms.push(relationship);
    this.relationshipsByFromID[relationship.from] = froms;
    const tos = this.relationshipsByToID[relationship.to] ?? [];
    tos.push(relationship);
    this.relationshipsByToID[relationship.to] = tos;
  }

  relationship_firstParent_byID(id: string) {
    const thing = this.thing_byID(id);
    const matches = this.relationships_byKind(RelationshipKind.parent, false, id);
    if (thing != null && matches.length > 0) {
      return matches[0];
    }
    return null;
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
      this.relationship_remember(relationship);
    }
  }

  relationships_byKind(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
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

}

export const hierarchy = new Hierarchy();
