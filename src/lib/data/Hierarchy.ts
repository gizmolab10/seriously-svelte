import { cloud, Thing, Relationship, RelationshipKind, Access, User, sortAccordingToOrder, constants } from '../common/GlobalImports';

////////////////////////////////////////
// creation, tracking and destruction //
//    of things and relationships     //
////////////////////////////////////////

export default class Hierarchy {
  relationshipKindsByKind: { [kind: string]: RelationshipKind } = {};
  relationshipKindsByID: { [id: string]: RelationshipKind } = {};
  relationshipsByFromID: { [id: string]: Array<Relationship> } = {};
  relationshipsByToID: { [id: string]: Array<Relationship> } = {};
  accessByKind: { [kind: string]: Access } = {};
  accessByID: { [id: string]: Access } = {};
  thingsByID: { [id: string]: Thing } = {};
  relationships: Array<Relationship> = [];
  userByID: { [id: string]: User } = {};
  root: Thing | null = null;
  here: Thing | null = null;

  constructor() {}

  get rootID(): (string | null) { return this.root?.id ?? null; };
  get things(): Array<Thing> { return Object.values(this.thingsByID) };
  thing_forID = (id: string | null): Thing | null => { return (id == null) ? null : this.thingsByID[id]; }
  thing_newAt = (order: number) => { return new Thing(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order); }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////
  
  things_forIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingsByID[id];
      if (thing != null) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

  things_forKind_andID(kind: RelationshipKind, id: string, matchingTo: boolean): Array<Thing> {
    const matches = this.relationships_byKindToID(kind, matchingTo, id);
    const ids: Array<string> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        ids.push(matchingTo ? relationship.from : relationship.to);
      }
    }
    return this.things_forIDs(ids);
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  relationship_new(id: string, kind: RelationshipKind, from: string, to: string, order: number): Relationship {
    const relationship = new Relationship(id, kind, from, to, order);
    this.relationship_remember(relationship);
    return relationship;
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

  relationship_parentTo(id: string) {
    const thing = this.thing_forID(id); // assure id is known
    const matches = this.relationships_byKindToID(RelationshipKind.isAChildOf, false, id);
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

  relationships_byKindToID(kind: RelationshipKind, to: boolean, id: string): Array<Relationship> {
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

  relationships_allMarkNeedDeleteForThing(thing: Thing) {
    const parentRelationships = hierarchy.relationshipsByFromID[thing.id];
    if (parentRelationships != null) {
      for (const relationship of parentRelationships) {
        relationship.needsDelete = true;
      }
    }
  }

  /////////////////////////////////////
  //         ANCILLARY DATA          //
  /////////////////////////////////////

  relationshipKind_new = (id: string, kind: string) => {
    const newKind = new RelationshipKind(id, kind);
    this.relationshipKindsByKind[kind] = newKind;
    this.relationshipKindsByID[id] = newKind;
  }

  access_new = (id: string, kind: string) => {
    const access = new Access(id, kind);
    this.accessByKind[kind] = access;
    this.accessByID[id] = access;
  }

  user_new = (id: string, name: string, email: string, phone: string) => {
    const user = new User(id, name, email, phone);
    this.userByID[id] = user;
  }

}

export const hierarchy = new Hierarchy();
