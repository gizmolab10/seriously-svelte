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
  getThing_forID = (idThing: string | null): Thing | null => { return (!idThing) ? null : this.knownT_byID[idThing]; }
  thing_createAt = (order: number) => { return new Thing(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order, false); }
  getPredicate_forID = (idPredicate: string | null): Predicate | null => { return (!idPredicate) ? null : this.knownP_byID[idPredicate]; }
  
  async constructHierarchy(type: string) {
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
            this.rememberRelationship_remoteCreateNoDuplicate(cloud.newCloudID, Predicate.idIsAParentOf, rootID, id, -1, CreationFlag.getRemoteID)
              .then((newRelationship) => {
                relationship = newRelationship;
              })
          }
        }
      }
      this.root?.normalizeOrder_recursive()   // setup order values for all things and relationships
      const root = hierarchy.root;
      cloud.hasDataForDBType[type] = true;
      if (root) {
        normalizeOrderOf(root.children)
        root.grabOnly()
      }
      thingsArrived.set(true);
      isBusy.set(false);
      this.isConstructed = true;
    }
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

  rememberThing_create(id: string, title: string, color: string, trait: string, order: number, isRemotelyStored: boolean): Thing {
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
    this.knownRs.push(relationship);
    this.knownR_byID[relationship.id] = relationship;
    this.rememberRelationshipByKnown(this.knownRs_byIDTo, relationship.idTo, relationship);
    this.rememberRelationshipByKnown(this.knownRs_byIDFrom, relationship.idFrom, relationship);
    this.rememberRelationshipByKnown(this.knownRs_byIDPredicate, relationship.idPredicate, relationship);
  }

  rememberRelationship_remoteCreateNoDuplicate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none): Promise<Relationship> {
    return new Promise(async (resolve) => {
      let relationship = this.getRelationship_whereParentIDEquals(idTo);
      if (relationship == null) {
        this.rememberRelationship_remoteCreate(idRelationship, idPredicate, idFrom, idTo, order, creationFlag)
        .then((relationship) => {
          resolve(relationship);
        })
      }
    })
  }

  rememberRelationship_remoteCreate(idRelationship: string, idPredicate: string, idFrom: string, idTo: string, order: number, creationFlag: CreationFlag = CreationFlag.none): Promise<Relationship> {
    return new Promise(async (resolve) => {
      const relationship = new Relationship(idRelationship, idPredicate, idFrom, idTo, order, creationFlag == CreationFlag.isFromRemote);
      cloud.relationship_remoteWrite(relationship).then(() => {
        this.rememberRelationship(relationship);
        resolve(relationship);
      })
    })
  }

  //////////////////////////
  //         GET          //
  //////////////////////////

  getThings_forIDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.knownT_byID[id];
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
    const matches = this.getRelationships_byIDPredicateToAndID(Predicate.idIsAParentOf, true, idThing);
    if (matches.length > 0) {
      return matches[0];
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

  rememberPredicate_create(id: string, kind: string) {
    const predicate = new Predicate(id, kind);
    this.rememberPredicate(predicate)
  }

  access_create(id: string, kind: string) {
    const access = new Access(id, kind);
    this.knownA_byKind[kind] = access;
    this.knownA_byID[id] = access;
  }

  user_create(id: string, name: string, email: string, phone: string) {
    const user = new User(id, name, email, phone);
    this.knownU_byID[id] = user;
  }

}

export const hierarchy = new Hierarchy();
