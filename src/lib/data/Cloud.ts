import { get, grabbedIDs, hierarchy, removeAll, normalizeOrderOf } from '../common/GlobalImports';
import { Thing, Relationship, RelationshipKind } from '../common/GlobalImports';
import { v4 as uuid } from 'uuid';
import Airtable from 'airtable';

/////////////////////////////////////////
//                                     //
//   CRUD for things & relationships   //
//        + edit order & parent        //
//                                     //
/////////////////////////////////////////

export default class Cloud {
  base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
  relationshipKinds_errorMessage = 'Error in RelationshipKinds:';
  relationshipKinds_table = this.base('RelationshipKinds');
  relationships_errorMessage = 'Error in Relationships:';
  relationships_table = this.base('Relationships');
  things_errorMessage = 'Error in Things:';
  things_table = this.base('Things');
  
  constructor() {}

  get newCloudID(): string { return 'NEW' + removeAll('-', uuid()).slice(10, 24); } // use last, most-unique bytes of uuid

  readAll = async (onCompletion: () => any) => {
    await this.relationshipKinds_readAll();
    await this.relationships_readAll();
    await this.things_readAll(onCompletion);
  }

  updateAllNeedy = async () => {
    await this.relationships_updateNeedy(); // do this first, in case a relationship points to a thing that needs delete
    await this.things_updateNeedy();
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  async things_readAll(onCompletion: () => any) {
    hierarchy.thingsByID = {}; // clear

    try {
      const records = await this.things_table.select().all()

      for (const record of records) {
        const id = record.id;
        const thing = new Thing(id, record.fields.title as string, record.fields.color as string, record.fields.trait as string);
        hierarchy.thingsByID[id] = thing;
        if (thing.trait == '!') {
          hierarchy.root = thing;
        }
      }

      const rootID = hierarchy.rootID;
      if (rootID != null) {
        const order = -1;
        for (const thing of hierarchy.things) {
          const id = thing.id;
          if (id != rootID){
            let relationship = hierarchy.relationship_parentTo(id);
            if (relationship != null) {
              thing.order = relationship.order;
            } else {
              thing.order = order;
              relationship = hierarchy.relationship_new(this.newCloudID, RelationshipKind.isAChildOf, id, rootID, order);
              relationship.needsCreate = true;
            }
          }
        }
      }

      hierarchy.root?.becomeHere()
      hierarchy.root?.grabOnly()
      onCompletion();
    } catch (error) {
      console.log(this.things_errorMessage + ' (things_readAll) ' + error);
    }
  }

  async things_updateNeedy() {
    for (const thing of hierarchy.things) {
      if (thing.needsDelete) {
        await this.thing_delete(thing)
      } else if (thing.needsCreate) {
        await this.thing_create(thing)
      } else if (thing.needsSave) {
        await this.thing_save(thing)
      }
    }
  }

  ////////////////////////////
  //         THING          //
  ////////////////////////////

  async thing_create(thing: Thing) {
    try {
      const fields = await this.things_table.create(thing.fields);
      const id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
      thing.id = id;
      thing.needsCreate = false;
      hierarchy.thingsByID[id] = thing;
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  async thing_save(thing: Thing) {
    try {
      await this.things_table.update(thing.id, thing.fields);
      thing.needsSave = false; // if update fails, subsequent update will try again
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  thing_delete = async (thing: Thing) => {
    try {
      await this.things_table.destroy(thing.id);
      delete hierarchy.thingsByID[thing.id];
      thing.needsDelete = false;
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  thing_duplicate = async (thing: Thing) => {
    const sibling = hierarchy.thing_newAt(thing.order + 0.5);
    const parent = thing.firstParent ?? hierarchy.root;
    sibling.copyFrom(thing);
    sibling.order += 0.1
    this.thing_redraw_addAsChild(sibling, parent);
  }

  thing_redraw_addAsChild = async (child: Thing, parent: Thing) => {
    await this.thing_create(child); // for everything below, need to await child.id fetched from cloud
    const relationship = hierarchy.relationship_new(this.newCloudID, RelationshipKind.isAChildOf, child.id, parent.id, child.order);
    relationship.needsCreate = true;
    normalizeOrderOf(parent.children);
    parent.becomeHere();
    child.editTitle(); // TODO: fucking causes app to hang!
    child.grabOnly();
    await this.updateAllNeedy();
  }

  thing_redraw_addChildTo = (parent: Thing) => {
    const child = hierarchy.thing_newAt(-1);
    this.thing_redraw_addAsChild(child, parent);
  }

  thing_redraw_moveRight(thing: Thing, right: boolean, relocate: boolean) {
    if (relocate) {
      this.thing_redraw_relocateRight(thing, right);
    } else {
      thing.redraw_browseRight(right);
    }
  }

  thing_redraw_relocateRight = async (thing: Thing, right: boolean) => {
    const newParent = right ? thing.nextSibling(false) : thing.grandparent;
    if (newParent != null) {

      // alter the 'to' in ALL [?] the matching 'from' relationships
      // simpler than adjusting children or parents arrays
      // TODO: also match against the 'to' to the current parent
      // TODO: pass kind in ... to support editing different kinds of relationships

      const relationship = hierarchy.relationship_parentTo(thing.id);
      if (relationship != null) {
        relationship.to = newParent.id;
        relationship.needsSave = true;
        thing.setOrderTo(-1);
      }

      hierarchy.relationships_refreshLookups();
      normalizeOrderOf(thing.siblings);   // refresh lookups first
      thing.grabOnly();
      newParent.becomeHere();
      this.updateAllNeedy();
    }
  }

  /////////////////////////////////////////
  //         RELATIONSHIP KINDS          //
  /////////////////////////////////////////

  async relationshipKinds_readAll() {
    try {
      const records = await this.relationshipKinds_table.select().all()

      for (const record of records) {
        const id = record.id as string; // do not yet need this
        const kind = record.fields.kind as string;
        hierarchy.relationshipKind_new(id, kind);
      }

    } catch (error) {
      console.log(this.relationshipKinds_errorMessage + error);
    }
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  async relationships_readAll() {
    hierarchy.relationships_clearLookups();
    try {
      const records = await this.relationships_table.select().all()

      for (const record of records) {
        const id = record.id as string;
        const tos = record.fields.to as (string[]);
        const order = record.fields.order as number;
        const froms = record.fields.from as (string[]);
        const kinds = record.fields.kind as (string[]);
        const kind = hierarchy.relationshipKindsByID[kinds[0]];
        hierarchy.relationship_new(id, kind, froms[0], tos[0], order);
      }
    } catch (error) {
      console.log(this.relationships_errorMessage + error);
    }
  }

  async relationships_updateNeedy() {
    for (const relationship of hierarchy.relationships) {
      if (relationship.needsDelete) {
          await this.relationship_delete(relationship);
      } else if (relationship.needsCreate) {
          await this.relationship_insertNew(relationship);
      } else if (relationship.needsSave) {
          await this.relationship_save(relationship);
      }
    };
  }

  async relationships_forThing_deleteAll(thing: Thing) {
    const array = hierarchy.relationshipsByFromID[thing.id];
    if (array != null) {
      for (const relationship of array) {
        await this.relationship_delete(relationship);
      }
      hierarchy.relationships_refreshLookups();
    }
  }

  ///////////////////////////////////
  //         RELATIONSHIP          //
  ///////////////////////////////////

  async relationship_insertNew(relationship: Relationship | null) {
    if (relationship != null) {
      try {
        const fields = await this.relationships_table.create(relationship.fields);   // insert with temporary id
        const id = fields['id'];                                                     // grab permanent id
        relationship.id = id;
        relationship.needsCreate = false;
        hierarchy.relationships_refreshLookups();
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

  async relationship_save(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
      relationship.needsSave = false;
    } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
    }
  }

  async relationship_delete(relationship: Relationship | null) {
    if (relationship != null) {
      try {
        hierarchy.relationships = hierarchy.relationships.filter((item) => item.id !== relationship.id);
        hierarchy.relationships_refreshLookups();
        await this.relationships_table.destroy(relationship.id);
        relationship.needsDelete = false;
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

  ////////////////////////////
  //         GRABS          //
  ////////////////////////////

  grabs_redraw_delete() {
    if (hierarchy.here != null) {
      for (const id of get(grabbedIDs)) {
        const grabbed = hierarchy.thing_forID(id);
        if (grabbed != null && !grabbed.isEditing && hierarchy.here != null) {
          let newGrabbed = grabbed.firstParent;
          const siblings = grabbed.siblings;
          let index = siblings.indexOf(grabbed);
          grabbed.needsDelete = true;
          siblings.splice(index, 1);
          if (siblings.length == 0) {
            grabbed.grandparent.becomeHere();
          } else {
            if (index >= siblings.length) {
              index = siblings.length - 1;
            }
            newGrabbed = siblings[index];
            normalizeOrderOf(grabbed.siblings);
          }
          const parentRelationships = hierarchy.relationshipsByFromID[grabbed.id];
          if (parentRelationships != null) {
            for (const relationship of parentRelationships) {
              relationship.needsDelete = true;
            }
          }
          newGrabbed.grabOnly();
          this.updateAllNeedy();
        }
      }
    }
  }
  
  grab_redraw_moveUp(up: boolean, expand: boolean, relocate: boolean) {
    const grab = hierarchy.highestGrab(up);
    grab.redraw_moveup(up, expand, relocate);
    if (relocate) {
      this.updateAllNeedy();
    }
  }

}

export const cloud = new Cloud();