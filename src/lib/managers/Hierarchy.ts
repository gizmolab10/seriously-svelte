import { User, Thing, cloud, Access, constants, Predicate, Relationship, CreationFlag, normalizeOrderOf, sortAccordingToOrder } from '../common/GlobalImports';
import { hereID, isBusy, thingsArrived } from './State';

type KnownRelationships = { [id: string]: Array<Relationship> }

////////////////////////////////////////
// creation, tracking and destruction //
//    of things and relationships     //
////////////////////////////////////////

export default class Hierarchy {
  knownU_byID: { [id: string]: User } = {};
  knownT_byID: { [id: string]: Thing } = {};
  knownA_byID: { [id: string]: Access } = {};
  knownP_byID: { [id: string]: Predicate } = {};
  knownR_byID: { [id: string]: Relationship } = {};
  knownP_byKind: { [kind: string]: Predicate } = {};
  knownA_byKind: { [kind: string]: Access } = {};
  knownRs_byIDPredicate: KnownRelationships = {};
  knownRs_byIDFrom: KnownRelationships = {};
  knownRs_byIDTo: KnownRelationships = {};
  knownRs: Array<Relationship> = [];
  root: Thing | null = null;
  isConstructed = false;

  constructor() {}

  get hasNothing(): boolean { return !this.root; }
  get rootID(): (string | null) { return this.root?.id ?? null; };
  get things(): Array<Thing> { return Object.values(this.knownT_byID) };
  getThing_forID(idThing: string | null): Thing | null { return (!idThing) ? null : this.knownT_byID[idThing]; }
  getPredicate_forID(idPredicate: string | null): Predicate | null { return (!idPredicate) ? null : this.knownP_byID[idPredicate]; }
  
  async constructHierarchy(type: string) {
    const rootID = this.rootID;
    if (this.root == null) {
      alert('no root!');
    } else if (rootID) {
      for (const thing of this.things) {
        const id = thing.id;
        if (id == rootID) {
          hereID.set(id);
        } else {
          let relationship = this.getRelationship_whereParentIDEquals(id);
          if (relationship) {
            thing.order = relationship.order;
          } else {
            const idPredicateIsAParentOf = Predicate.idIsAParentOf;
            
            // already determined that WE DO NOT NEED NoDuplicate, we do need it's id now

            await this.rememberRelationship_remoteCreate(cloud.newCloudID, idPredicateIsAParentOf, rootID, id, -1, CreationFlag.getRemoteID)
          }
        }
      }
      this.root.normalizeOrder_recursive()   // setup order values for all things and relationships
      cloud.hasDataForDBType[type] = true;
      normalizeOrderOf(this.root.children)
      this.root.grabOnly()
    }
    thingsArrived.set(true);
    isBusy.set(false);
    this.isConstructed = true;
  }

  /////////////////////////////
  //         MEMORY          //
  /////////////////////////////

  rememberThing(thing: Thing) {
    hierarchy.knownT_byID[thing.id] = thing;
    if (thing.trait == '!') {
      hierarchy.root = thing;
    }
  }

  resetRootFrom(things: Array<Thing>) {
    this.knownT_byID = {};
    for (const thing of things) {
      const id = thing.id;
      this.knownT_byID[id] = thing;
      if (thing.trait == '!') {
        this.root = thing;
        hereID.set(id);
      }
    }
  }

  thing_runtimeCreateAt(order: number) {
    return this.rememberThing_runtimeCreate(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order, false);
  }

  rememberThing_runtimeCreate(id: string, title: string, color: string, trait: string, order: number, isRemotelyStored: boolean): Thing {
    const thing = new Thing(id, title, color, trait, order, isRemotelyStored);
    this.rememberThing(thing);
    return thing;
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

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
      this.rememberRelationship(relationship);
    }
  }

  rememberRelationshipByKnown(known: KnownRelationships, idRelationship: string, relationship: Relationship) {
    let array = known[idRelationship] ?? [];
    array.push(relationship);
    known[idRelationship] = array;
  }

  rememberRelationship(relationship: Relationship) {
    if (!this.knownR_byID[relationship.id]) {
      this.knownRs.push(relationship);
      this.knownR_byID[relationship.id] = relationship;
      this.rememberRelationshipByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
      this.rememberRelationshipByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
      this.rememberRelationshipByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
      console.log('remember', relationship.description);
    }
  }

  async rememberRelationship_remoteCreateNoDuplicate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
    return this.getRelationship_whereParentIDEquals(idTo) ?? await this.rememberRelationship_remoteCreate(idRelationship, idPredicate, idFrom, idTo, order, creationFlag);
  }

  async rememberRelationship_remoteCreate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none) {
    const relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
    await cloud.relationship_remoteWrite(relationship);
    this.rememberRelationship(relationship);
    // console.log('create', relationship.description);
    return relationship;
  }

  //////////////////////////
  //         GET          //
  //////////////////////////

  getThings_forIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.getThing_forID(id);
      if (thing) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

  getThings_byIDPredicateToAndID(idPredicate: string, to: boolean, idThing: string): Array<Thing> {
    const matches = this.getRelationships_byIDPredicateToAndID(idPredicate, to, idThing);
    const ids: Array<string> = [];
    if (Array.isArray(matches) && matches.length > 0) {
      for (const relationship of matches) {
        ids.push(to ? relationship.idFrom : relationship.idTo);
      }
    }
    return this.getThings_forIDs(ids);
  }

  getRelationship_whereParentIDEquals(idThing: string) {
    const idPredicateIsAParentOf = Predicate.idIsAParentOf;
    const matches = this.getRelationships_byIDPredicateToAndID(idPredicateIsAParentOf, true, idThing);
    if (matches.length > 0) {
      const relationship = matches[0];
      // console.log('known', relationship.description);
      return relationship;
    }
    return null;
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

  rememberPredicate(predicate: Predicate) {
    this.knownP_byKind[predicate.kind] = predicate;
    this.knownP_byID[predicate.id] = predicate;
  }

  rememberPredicate_runtimeCreate(id: string, kind: string) {
    const predicate = new Predicate(id, kind);
    this.rememberPredicate(predicate)
  }

  access_runtimeCreate(id: string, kind: string) {
    const access = new Access(id, kind);
    this.knownA_byKind[kind] = access;
    this.knownA_byID[id] = access;
  }

  user_runtimeCreate(id: string, name: string, email: string, phone: string) {
    const user = new User(id, name, email, phone);
    this.knownU_byID[id] = user;
  }

}

export const hierarchy = new Hierarchy();
