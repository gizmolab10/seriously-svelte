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
  predicatesByKind: { [kind: string]: Predicate } = {};
  predicatesByID: { [id: string]: Predicate } = {};
  accessByKind: { [kind: string]: Access } = {};
  accessByID: { [id: string]: Access } = {};
  thingsByID: ThingsLookup = {};
  relationships: Array<Relationship> = [];
  userByID: { [id: string]: User } = {};
  root: Thing | null = null;

  get hasNothing(): boolean { return !this.root; }
  get rootID(): (string | null) { return this.root?.id ?? null; };
  get things(): Array<Thing> { return Object.values(this.thingsByID) };
  thing_forID = (id: string | null): Thing | null => { return (!id) ? null : this.thingsByID[id]; }
  predicate_forID = (id: string | null): Predicate | null => { return (!id) ? null : this.predicatesByID[id]; }
  thing_newAt = (order: number) => { return new Thing(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order); }
  
  /////////////////////////////
  //         MEMORY          //
  /////////////////////////////

  predicate_remember(predicate: Predicate) {
    this.predicatesByKind[predicate.kind] = predicate;
    this.predicatesByID[predicate.id] = predicate;
  }

  thing_remember(thing: Thing) {
    hierarchy.thingsByID[thing.id] = thing;
    if (thing.trait == '!') {
      hierarchy.root = thing;
    }
  }

  relationship_rememberByKind(kind: ForOfStatement, relationship: Relationship) {
    switch (kind) {

    }
  }

  relationship_remember(relationship: Relationship) {
    const tos = this.relationshipsByIDTo[relationship.idTo] ?? [];
    const froms = this.relationshipsByIDFrom[relationship.idFrom] ?? [];
    const predicates = this.relationshipsByIDPredicate[relationship.idPredicate] ?? [];
    tos.push(relationship);
    froms.push(relationship);
    predicates.push(relationship);
    this.relationshipsByIDTo[relationship.idTo] = tos;
    this.relationshipsByIDFrom[relationship.idFrom] = froms;
    this.relationshipsByIDPredicate[relationship.idPredicate] = predicates;
    this.relationships.push(relationship);
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

  hierarchy_construct() {
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
            relationship = this.relationship_new(cloud.newCloudID, Predicate.idIsAParentOf, rootID, id, order);
            relationship.needsCreate(true);
          }
        }
      }
      this.root?.order_normalizeRecursive()   // setup order values
    }
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

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

  things_byIDPredicateToAndID(idPredicate: string, to: boolean, id: string): Array<Thing> {
    const matches = this.relationships_byIDPredicateToAndID(idPredicate, to, id);
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

  relationship_new(id: string, idPredicate: string, idFrom: string, idTo: string, order: number): Relationship {
    if (idTo == 'recBZ4zq7MpGP9D3N') {
      console.log('hah');
    }
    const relationship = new Relationship(id, idPredicate, idFrom, idTo, order);
    this.relationship_remember(relationship);
    return relationship;
  }

  relationship_newUnique(id: string, idPredicate: string, idFrom: string, idTo: string, order: number): Relationship {
    const matches = this.relationships_byIDPredicateToAndID(Predicate.idIsAParentOf, false, id);
    if (matches.length > 0) {
      return matches[0];
    }
    return this.relationship_new(id, idPredicate, idFrom, idTo, order);
  }

  relationship_parentTo(id: string) {
    const thing = this.thing_forID(id); // assure id is known
    const matches = this.relationships_byIDPredicateToAndID(Predicate.idIsAParentOf, true, id);
    if (thing && matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  relationships_clearLookups() {
    this.relationships = [];
    this.relationshipsByIDTo = {};
    this.relationshipsByIDFrom = {};
  }

  relationships_refreshLookups() {
    const saved = this.relationships;
    this.relationships_clearLookups();
    for (const relationship of saved) {
      this.relationship_remember(relationship);
    }
  }

  relationships_byIDPredicateToAndID(idPredicate: string, to: boolean, id: string): Array<Relationship> {
    const dict = to ? this.relationshipsByIDTo : this.relationshipsByIDFrom;
    const matches = dict[id] as Array<Relationship>; // filter out baaaaad values
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
