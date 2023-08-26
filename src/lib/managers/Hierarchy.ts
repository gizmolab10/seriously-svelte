import { User, Thing, cloud, Access, constants, Predicate, Relationship, CreationFlag, sortAccordingToOrder } from '../common/GlobalImports';
import { hereID } from './State';

type KnownThings = { [id: string]: Thing }
type KnownRelationships = { [id: string]: Array<Relationship> }

////////////////////////////////////////
// creation, tracking and destruction //
//    of things and relationships     //
////////////////////////////////////////

export default class Hierarchy {
  knownTs_byID: KnownThings = {};
  knownRs: Array<Relationship> = [];
  knownRs_byIDTo: KnownRelationships = {};
  knownRs_byIDFrom: KnownRelationships = {};
  knownRs_byIDPredicate: KnownRelationships = {};
  knownR_byID: { [id: string]: Relationship } = {};
  knownP_byKind: { [kind: string]: Predicate } = {};
  knownA_byKind: { [kind: string]: Access } = {};
  knownP_byID: { [id: string]: Predicate } = {};
  knownA_byID: { [id: string]: Access } = {};
  knownU_byID: { [id: string]: User } = {};
  root: Thing | null = null;
  isConstructed = false;

  constructor() {}

  get hasNothing(): boolean { return !this.root; }
  get rootID(): (string | null) { return this.root?.id ?? null; };
  get things(): Array<Thing> { return Object.values(this.knownTs_byID) };
  order_normalizeAllRecursive() { this.root?.order_normalizeRecursive(); };
  getThing_forID = (idThing: string | null): Thing | null => { return (!idThing) ? null : this.knownTs_byID[idThing]; }
  thing_createAt = (order: number) => { return new Thing(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order, false); }
  getPredicate_forID = (idPredicate: string | null): Predicate | null => { return (!idPredicate) ? null : this.knownP_byID[idPredicate]; }
  
  async hierarchy_construct() {
    const rootID = this.rootID;
    if (rootID) {
      for (const thing of this.things) {
        const id = thing.id;
        if (id == rootID) {
          hereID.set(id);
        } else {
          let relationship = this.getRelationship_whereParentIDEquals(id);
          if (relationship) {
            thing.order = relationship.order;
          } else { // already determined that we do not need assureNotDuplicated, we do need it's id now
            relationship = this.relationship_create(cloud.newCloudID, Predicate.idIsAParentOf, rootID, id, -1, CreationFlag.getRemoteID);
          }
        }
      }
      this.order_normalizeAllRecursive()   // setup order values for all things and relationships
      this.isConstructed = true;
      try {
      } catch (error) {
        console.log(error);
      }
    }
  }

  /////////////////////////////
  //         MEMORY          //
  /////////////////////////////

  predicate_remember(predicate: Predicate) {
    this.knownP_byKind[predicate.kind] = predicate;
    this.knownP_byID[predicate.id] = predicate;
  }

  thing_remember(thing: Thing) {
    hierarchy.knownTs_byID[thing.id] = thing;
    if (thing.trait == '!') {
      hierarchy.root = thing;
    }
  }

  relationship_rememberByKnown(known: KnownRelationships, idRelationship: string, relationship: Relationship) {
    let array = known[idRelationship] ?? [];
    array.push(relationship);
    known[idRelationship] = array;
  }

  relationship_remember(relationship: Relationship) {
    this.knownRs.push(relationship);
    this.knownR_byID[relationship.id] = relationship;
    this.relationship_rememberByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
    this.relationship_rememberByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
    this.relationship_rememberByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
  }

  resetRootFrom(things: Array<Thing>) {
    this.knownTs_byID = {};
    for (const thing of things) {
      const id = thing.id;
      this.knownTs_byID[id] = thing;
      if (thing.trait == '!') {
        this.root = thing;
        hereID.set(id);
      }
    }
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  thing_create(id: string, title: string, color: string, trait: string, order: number): Thing {
    const thing = new Thing(id, title, color, trait, order, false);
    this.thing_remember(thing);
    return thing;
  }

  things_forIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.knownTs_byID[id];
      if (thing) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

  things_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Thing> {
    const matches = this.getRelationships_byIDPredicateToAndID(idPredicate, to, idThing);
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

  relationship_create_assureNotDuplicated(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none): Relationship {
    return this.getRelationship_whereParentIDEquals(idTo) ??
      this.relationship_create(idRelationship, idPredicate, idFrom, idTo, order, creationFlag);
  }

  relationship_create(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none): Relationship {
    const relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
    cloud.relationship_pushToRemote(relationship);
    this.relationship_remember(relationship);
    return relationship;
  }

  getRelationship_whereParentIDEquals(idThing: string) {
    const matches = this.getRelationships_byIDPredicateToAndID(Predicate.idIsAParentOf, true, idThing);
    if (matches.length > 0) {
      return matches[0];
    }
    return null;
  }

  relationships_clearKnowns() {
    this.knownRs = [];
    this.knownR_byID = {};
    this.knownRs_byIDTo = {};
    this.knownRs_byIDFrom = {};
    this.knownRs_byIDPredicate = {};
  }

  relationships_refreshKnowns() {
    const saved = this.knownRs;
    this.relationships_clearKnowns();
    for (const relationship of saved) {
      this.relationship_remember(relationship);
    }
  }

  getRelationships_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Relationship> {
    const dict = to ? this.knownRs_byIDTo : this.knownRs_byIDFrom;
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

  /////////////////////////////////////
  //         ANCILLARY DATA          //
  /////////////////////////////////////

  predicate_create = (id: string, kind: string) => {
    const predicate = new Predicate(id, kind);
    this.predicate_remember(predicate)
  }

  access_create = (id: string, kind: string) => {
    const access = new Access(id, kind);
    this.knownA_byKind[kind] = access;
    this.knownA_byID[id] = access;
  }

  user_create = (id: string, name: string, email: string, phone: string) => {
    const user = new User(id, name, email, phone);
    this.knownU_byID[id] = user;
  }

}

export const hierarchy = new Hierarchy();
