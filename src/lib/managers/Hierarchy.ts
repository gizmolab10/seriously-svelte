import { User, Thing, cloud, Access, constants, Predicate, Relationship, sortAccordingToOrder } from '../common/GlobalImports';
import { hereID } from './State';

type ThingsLookup = { [id: string]: Thing }
type RelationshipsLookup = { [id: string]: Array<Relationship> }

////////////////////////////////////////
// creation, tracking and destruction //
//    of things and relationships     //
////////////////////////////////////////

export default class Hierarchy {
  relationshipsByIDPredicate: RelationshipsLookup = {};
  relationshipsByIDFrom: RelationshipsLookup = {};
  relationshipsByIDTo: RelationshipsLookup = {};
  relationshipByID: { [id: string]: Relationship } = {};
  predicateByKind: { [kind: string]: Predicate } = {};
  predicateByID: { [id: string]: Predicate } = {};
  accessByKind: { [kind: string]: Access } = {};
  accessByID: { [id: string]: Access } = {};
  relationships: Array<Relationship> = [];
  userByID: { [id: string]: User } = {};
  thingsByID: ThingsLookup = {};
  root: Thing | null = null;
  isConstructed = false;

  constructor() {}

  get hasNothing(): boolean { return !this.root; }
  get rootID(): (string | null) { return this.root?.id ?? null; };
  get things(): Array<Thing> { return Object.values(this.thingsByID) };
  order_normalizeAllRecursive() { this.root?.order_normalizeRecursive(); };
  thing_forID = (idThing: string | null): Thing | null => { return (!idThing) ? null : this.thingsByID[idThing]; }
  thing_newAt = (order: number) => { return new Thing(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order); }
  predicate_forID = (idPredicate: string | null): Predicate | null => { return (!idPredicate) ? null : this.predicateByID[idPredicate]; }
  
  async hierarchy_construct() {
    const rootID = this.rootID;
    if (rootID) {
      const order = -1;
      for (const thing of this.things) {
        const id = thing.id;
        if (id == rootID) {
          hereID.set(id);
        } else {
          let relationship = this.relationship_parentTo(id);
          if (relationship) {
            thing.order = relationship.order;
          } else {
            thing.order = order;
            relationship = this.relationship_new_assureNotDuplicated(cloud.newCloudID, Predicate.idIsAParentOf, rootID, id, order, true);
          }
        }
      }
      this.order_normalizeAllRecursive()   // setup order values
      this.isConstructed = true;
      try {
        await cloud.handleAllNeeds();
      } catch (error) {
        console.log(error);
      }
    }
  }

  /////////////////////////////
  //         MEMORY          //
  /////////////////////////////

  predicate_remember(predicate: Predicate) {
    this.predicateByKind[predicate.kind] = predicate;
    this.predicateByID[predicate.id] = predicate;
  }

  thing_remember(thing: Thing) {
    hierarchy.thingsByID[thing.id] = thing;
    if (thing.trait == '!') {
      hierarchy.root = thing;
    }
  }

  relationship_rememberByLookup(lookup: RelationshipsLookup, idRelationship: string, relationship: Relationship) {
    let array = lookup[idRelationship] ?? [];
    array.push(relationship);
    lookup[idRelationship] = array;
  }

  relationship_remember(relationship: Relationship) {
    this.relationships.push(relationship);
    this.relationshipByID[relationship.id] = relationship;
    this.relationship_rememberByLookup(this.relationshipsByIDTo, relationship.idTo, relationship);
    this.relationship_rememberByLookup(this.relationshipsByIDFrom, relationship.idFrom, relationship);
    this.relationship_rememberByLookup(this.relationshipsByIDPredicate, relationship.idPredicate, relationship);
  }

  resetRootFrom(things: Array<Thing>) {
    this.thingsByID = {};
    for (const thing of things) {
      const id = thing.id;
      this.thingsByID[id] = thing;
      if (thing.trait == '!') {
        this.root = thing;
        hereID.set(id);
      }
    }
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  get needyThings(): Array<Thing> {
    let needy = new Array<Thing>();
    for (const thing of this.things) {
      if (thing.hasNeeds) {
        needy.push(thing);
      }
    }
    return needy;
  }

  thing_new(id: string, title: string, color: string, trait: string, order: number): Thing {
    const thing = new Thing(id, title, color, trait, order);
    this.thing_remember(thing);
    return thing;
  }

  things_forIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingsByID[id];
      if (thing) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

  things_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Thing> {
    const matches = this.relationships_byIDPredicateToAndID(idPredicate, to, idThing);
    const ids: Array<string> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        ids.push(to ? relationship.idFrom : relationship.idTo);
      }
    }
    return this.things_forIDs(ids);
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  get needyRelationships(): Array<Relationship> {
    let needy = new Array<Relationship>();
    for (const relationship of this.relationships) {
      if (relationship.hasNeeds) {
        needy.push(relationship);
      }
    }
    return needy;
  }

  relationship_new_assureNotDuplicated(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, needsRemoteID: boolean = false): Relationship {
    return this.relationship_parentTo(idTo) ??
      this.relationship_new(idRelationship, idPredicate, idFrom, idTo, order, needsRemoteID);
  }

  relationship_new(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, needsRemoteID: boolean = false): Relationship {
    const relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order);
    if (needsRemoteID) {
      cloud.relationship_remoteCreate(relationship) // from hierarchy construct
    } else {
      relationship.needsUpdate(true); // from snapshot
    }
    this.relationship_remember(relationship);
    return relationship;
  }

  relationship_parentTo(idThing: string) {
    const matches = this.relationships_byIDPredicateToAndID(Predicate.idIsAParentOf, true, idThing);
    if (matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  relationships_clearLookups() {
    this.relationships = [];
    this.relationshipByID = {};
    this.relationshipsByIDTo = {};
    this.relationshipsByIDFrom = {};
    this.relationshipsByIDPredicate = {};
  }

  relationships_refreshLookups() {
    const saved = this.relationships;
    this.relationships_clearLookups();
    for (const relationship of saved) {
      this.relationship_remember(relationship);
    }
  }

  relationships_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Relationship> {
    const dict = to ? this.relationshipsByIDTo : this.relationshipsByIDFrom;
    const matches = dict[idThing] as Array<Relationship>; // filter out bad values (dunno what this does)
    const array: Array<Relationship> = [];
    if (Array.isArray(matches)) {
      for (const relationship of matches) {
        if (relationship.idPredicate == idPredicate) {
          array.push(relationship);
        }
      }
    }
    return array;
  }

  relationships_allMarkNeedDeleteForThing(thing: Thing) {
    const parentRelationships = hierarchy.relationshipsByIDFrom[thing.id];
    if (parentRelationships) {
      for (const relationship of parentRelationships) {
        relationship.needsDelete(true);
      }
    }
  }

  /////////////////////////////////////
  //         ANCILLARY DATA          //
  /////////////////////////////////////

  predicate_new = (id: string, kind: string) => {
    const predicate = new Predicate(id, kind);
    this.predicate_remember(predicate)
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
