import { constants, User, Thing, Access, Relationship, Predicate, DBTypes, crudEditor, sortAccordingToOrder } from '../common/GlobalImports';
import { firebase } from '../persistence/Firebase';
import { hereID, dbType } from './State';
import fs from 'fs';

////////////////////////////////////////
// creation, tracking and destruction //
//    of things and relationships     //
////////////////////////////////////////

export default class Hierarchy {
  relationshipsByFromID: { [id: string]: Array<Relationship> } = {};
  relationshipsByToID: { [id: string]: Array<Relationship> } = {};
  predicatesByKind: { [kind: string]: Predicate } = {};
  predicatesByID: { [id: string]: Predicate } = {};
  statusByType: { [type: string]: boolean } = {};
  accessByKind: { [kind: string]: Access } = {};
  accessByID: { [id: string]: Access } = {};
  thingsByID: { [id: string]: Thing } = {};
  relationships: Array<Relationship> = [];
  userByID: { [id: string]: User } = {};
  root: Thing | null = null;
  here: Thing | null = null;

  constructor() {
    hereID.subscribe((id: string | null) => {
      this.here = this.thing_forID(id); 
    })
  }

  get hasNothing(): boolean { return this.root == null; }
  get rootID(): (string | null) { return this.root?.id ?? null; };
  get things(): Array<Thing> { return Object.values(this.thingsByID) };
  thing_forID = (id: string | null): Thing | null => { return (id == null) ? null : this.thingsByID[id]; }
  thing_newAt = (order: number) => { return new Thing(crudEditor.newCloudID, constants.defaultTitle, 'blue', 't', order); }
  
  setup = (dbType: string, onCompletion: () => any) => {
    if (this.statusByType[dbType] == true) {
      this.resetRootFor(dbType);
      onCompletion();
    } else {
      const done = () => {
        this.hierarchy_construct();
        this.statusByType[dbType] = true;
        onCompletion();
      }
      switch (dbType) {
        case DBTypes.airtable: this.setupCRUD(done); break;
        default: firebase.fetchAll(done); break;
      }
    }
  }

  resetRootFor(dbType: string) {
    if (dbType == DBTypes.airtable) {
      this.thingsByID = {};
      for (const thing of crudEditor.things) {
        const id = thing.id;
        this.thingsByID[id] = thing;
        if (thing.trait == '!') {
          this.root = thing;
          hereID.set(id);
        }
      }
    }
  }

  setupCRUD = async (onCompletion: () => any) => {
    crudEditor.readAll(async () => {
      hierarchy.root?.becomeHere()
      onCompletion();
      setTimeout(() => { // give crumbs time to be created after launch
        hierarchy.root?.grabOnly()
      }, 1);
    });
  }

  hierarchy_construct() {
    const rootID = this.rootID;
    if (rootID != null) {
      const order = -1;
      for (const thing of this.things) {
        const id = thing.id;
        if (id != rootID){
          let relationship = this.relationship_parentTo(id);
          if (relationship != null) {
            thing.order = relationship.order;
          } else {
            thing.order = order;
            relationship = this.relationship_new(crudEditor.newCloudID, Predicate.isAChildOf, id, rootID, order);
            relationship.needsCreate = true;
          }
        }
      }
    }
  }

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

  things_forKind_andID(kind: Predicate, id: string, matchingTo: boolean): Array<Thing> {
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

  relationship_new(id: string, kind: Predicate, from: string, to: string, order: number): Relationship {
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
    const matches = this.relationships_byKindToID(Predicate.isAChildOf, false, id);
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

  relationships_byKindToID(kind: Predicate, to: boolean, id: string): Array<Relationship> {
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

  predicate_new = (id: string, kind: string) => {
    const newKind = new Predicate(id, kind);
    this.predicatesByKind[kind] = newKind;
    this.predicatesByID[id] = newKind;
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

  object_writeToURL(object: any, filePath: string) {
    const jsonData = JSON.stringify(object, null, 2); // 2 spaces for indentation
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing JSON to file:', err);
      } else {
        console.log('JSON data has been written to', filePath);
      }
    });
  }

}

export const hierarchy = new Hierarchy();
