import { get, grabbedIDs, hierarchy, Thing, Relationship, RelationshipKind, removeAll, normalizeOrderOf, signal, Signals, constants } from '../common/GlobalImports';
import { v4 as uuid } from 'uuid';
import Airtable from 'airtable';

///////////////////////////////////////
// CRUD for things and relationships //
///////////////////////////////////////

export default class Cloud {
  base = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
  relationships_errorMessage = 'Error in Relationships:';
  relationships_table = this.base('Relationships');
  things_errorMessage = 'Error in Things:';
  things_table = this.base('Things');
  
  constructor() {}

  get newCloudID(): string { return 'new' + removeAll('-', uuid()).slice(10, 24); }
  thing_createAt = (order: number) => { return new Thing(cloud.newCloudID, constants.defaultTitle, 'blue', 't', order); }

  readAll = async (onCompletion: () => any) => {
    await this.relationships_readAll();
    await this.things_readAll(onCompletion);
  }

  saveAllDirty = () => {
    // this.relationships_saveDirty();
    this.things_saveDirty();
  }

  ////////////////////////////
  //         GRABS          //
  ////////////////////////////

  grabs_redraw_delete() {
    const ids = get(grabbedIDs);
    for (const id of ids) {
      const grabbed = hierarchy.thing_byID(id);
      if (grabbed != null && !grabbed.isEditing && hierarchy.here != null) {
        const siblings = grabbed.siblings;
        let index = siblings.indexOf(grabbed);
        siblings.splice(index, 1);
        if (siblings.length == 0) {
          grabbed.grandparent.becomeHere();
          grabbed.firstParent.grabOnly();
        } else {
          if (index >= siblings.length) {
            index = siblings.length - 1;
          }
          if (index >= 0) {
            siblings[index].grabOnly();
          }        
        }
        normalizeOrderOf(siblings);
        signal(Signals.widgets);
        cloud.thing_delete(grabbed);
        cloud.things_saveDirty();
        cloud.relationships_forThing_deleteAll(grabbed);
      }
    }
  }
  
  grab_redraw_moveUp(up: boolean, expand: boolean, relocate: boolean) {
    const grab = hierarchy.highestGrab(up);
    grab.redraw_moveup(up, expand, relocate);
    if (relocate) {
      cloud.things_saveDirty();
    }
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

      for (const id in hierarchy.thingsByID) {
        const rootID = hierarchy.rootID;
        const thing = hierarchy.thing_byID(id);
        if (thing != null && rootID != null && rootID != id) {
          hierarchy.relationship_createUnique(RelationshipKind.parent, id, rootID, -1);
          const order = hierarchy.relationship_firstParent_byID(id)?.order;
          if (order != null) {
            thing.order = order;
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

  async things_saveDirty() {
    const all: Thing[] = Object.values(hierarchy.thingsByID);
    for (const thing of all) {
      if (thing.needsSave) {
        await this.thing_save(thing)
      }
    }
  }

  async thing_insert(thing: Thing) {
    try {
      
      const fields = await this.things_table.create(thing.fields);
      const id = fields['id']; //  // need for update, delete and thingsByID (to get parent from relationship)
      thing.id = id;
      await this.things_table.destroy(id);
      await this.things_table.create(thing.fields); // re-insert with corrected id
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
    delete(hierarchy.thingsByID[thing.id]);
    try {
      await this.things_table.destroy(thing.id);
    } catch (error) {
      console.log(this.things_errorMessage + thing.debugTitle + error);
    }
  }

  thing_duplicate = async (thing: Thing) => {
    const sibling = this.thing_createAt(thing.order + 0.5);
    const parent = thing.firstParent ?? hierarchy.root;
    sibling.copyFrom(thing);
    sibling.order += 0.1
    this.thing_redraw_addAsChild(sibling, parent);
  }

  thing_redraw_addAsChild = async (child: Thing, parent: Thing) => {
    await cloud.thing_insert(child); // for everything below, need to await child.id fetched from cloud
    const childID = child.id;
    const relationship = hierarchy.relationship_createUnique(RelationshipKind.parent, childID, parent.id, child.order);
    hierarchy.relationships_refreshLookups();
    normalizeOrderOf(parent.children);
    parent.becomeHere();
    // child.edit(); // TODO: fucking causes app to hang!
    // child.grabOnly();
    signal(Signals.widgets);
    // await cloud.relationship_insert(relationship);
    cloud.saveAllDirty();
  }

  thing_redraw_addChildTo = (parent: Thing) => {
    const child = this.thing_createAt(-1);
    this.thing_redraw_addAsChild(child, parent);
  }

  thing_redraw_relocateRight = async (thing: Thing, right: boolean) => {
    const newParent = right ? thing.nextSibling(false) : thing.grandparent;
    if (newParent != null) {
      thing.needsSave = true;     // order will change
      const matches = hierarchy.relationships_byKind(RelationshipKind.parent, false, thing.id);

      // alter the 'to' in ALL [?] the matching 'from' relationships
      // simpler than adjusting children or parents arrays
      // TODO: also match against the 'to' to the current parent
      // TODO: pass kind in ... to support editing different kinds of relationships

      for (let index = 0; index < matches.length; index++) {
        const relationship = matches[index];
        relationship.to = newParent.id;
        relationship.needsSave = true;                // save thing new 'to'
      }

      hierarchy.relationships_refreshLookups();
      thing.grabOnly();
      signal(Signals.widgets);                        // signal BEFORE becomeHere to avoid blink
      newParent.becomeHere();
      cloud.saveAllDirty();
    }
  }

  thing_redraw_moveRight(thing: Thing, right: boolean, relocate: boolean) {
    if (relocate) {
      this.thing_redraw_relocateRight(thing, right);
    } else {
      thing.redraw_browseRight(right);
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
        const kind = record.fields.kind as RelationshipKind;
        const relationship = new Relationship(id, kind, froms[0], tos[0], order);
        hierarchy.relationship_remember(relationship);
      }
    } catch (error) {
      console.log(this.relationships_errorMessage + error);
    }
  }

  async relationships_saveDirty() {
    hierarchy.relationships.forEach((relationship) => {
      if (relationship.needsSave) {
          this.relationship_save(relationship);
      }
    });
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

  async relationship_insert(relationship: Relationship | null) {
    if (relationship != null) {
      try {
        const fields = await this.relationships_table.create(relationship.fields);
        const id = fields['id'];
        relationship.id = id;
        await this.relationships_table.destroy(id);
        await this.relationships_table.create(relationship.fields); // re-insert with corrected id
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

  async relationship_createUnique_insert(kind: RelationshipKind, from: string, to: string, order: number) {
    await this.relationship_insert(hierarchy.relationship_createUnique(kind, from, to, order));
  }

  async relationship_save(relationship: Relationship) {
    try {
      this.relationships_table.update(relationship.id, relationship.fields);
      relationship.needsSave = false;
    } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
    }
  }

  async relationship_delete(relationship: Relationship | null, keepInMemory: boolean = false) {
    if (relationship != null) {
      try {
        if (!keepInMemory) {
          hierarchy.relationships = hierarchy.relationships.filter((item) => item.id !== relationship.id);
          hierarchy.relationships_refreshLookups();
        }
        await this.relationships_table.destroy(relationship.id);
      } catch (error) {
        console.log(this.relationships_errorMessage + ' (' + relationship.id + ') ' + error);
      }
    }
  }

}

export const cloud = new Cloud();