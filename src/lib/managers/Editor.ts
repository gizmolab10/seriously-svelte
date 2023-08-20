import { get, grabs, Thing, cloud, hierarchy, Predicate, normalizeOrderOf } from '../common/GlobalImports';
import { hereID, grabbedIDs } from './State';

///////////////////////////////////////
//                                   //
//   beyond basic CRUD operations    //
//                                   //
///////////////////////////////////////

export default class Editor {
  here: Thing | null = null;

  constructor() {
    hereID.subscribe((id: string | null) => {
      this.here = hierarchy.thing_forID(id); 
    })
  }

  /////////////////////////////
  //         THINGS          //
  /////////////////////////////

  thing_duplicate = async (thing: Thing) => {
    const sibling = hierarchy.thing_newAt(thing.order + 0.1);
    const parent = thing.firstParent ?? hierarchy.root;
    sibling.copyFrom(thing);
    sibling.order += 0.1
    this.thing_redraw_addAsChild(sibling, parent);
  }

  thing_redraw_addAsChild = async (child: Thing, parent: Thing) => {
    await cloud.thing_create(child); // for everything below, need to await child.id fetched from cloud
    const relationship = hierarchy.relationship_new(cloud.newCloudID, Predicate.idIsAParentOf, child.id, parent.id, child.order);
    relationship.needsCreate(true);
    normalizeOrderOf(parent.children);
    parent.becomeHere();
    child.startEdit(); // TODO: fucking causes app to hang!
    child.grabOnly();
    await cloud.updateAllNeedy();
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
    if (newParent) {

      // alter the 'to' in ALL [?] the matching 'from' relationships
      // simpler than adjusting children or parents arrays
      // TODO: also match against the 'to' to the current parent
      // TODO: pass predicate in ... to support editing different kinds of relationships

      const relationship = hierarchy.relationship_parentTo(thing.id);
      if (relationship) {
        relationship.idTo = newParent.id;
        relationship.needsSave(true);
        thing.setOrderTo(-1);
      }

      hierarchy.relationships_refreshLookups();
      normalizeOrderOf(thing.siblings);   // refresh lookups first
      thing.grabOnly();
      newParent.becomeHere();
      await cloud.updateAllNeedy();
    }
  }

  ////////////////////////////
  //         GRABS          //
  ////////////////////////////

  async grabs_redraw_delete() {
    if (this.here) {
      for (const id of get(grabbedIDs)) {
        const grabbed = hierarchy.thing_forID(id);
        if (grabbed && !grabbed.isEditing && this.here) {
          let newGrabbed = grabbed.firstParent;
          const siblings = grabbed.siblings;
          let index = siblings.indexOf(grabbed);
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
          grabbed.traverse((child: Thing) => {
            this.relationships_deleteAllForThing(child);
            cloud.thing_delete(child);
            return false; // continue the traversal
          });
          await cloud.updateAllNeedy();
          newGrabbed.grabOnly();
        }
      }
    }
  }

  async furthestGrab_redraw_moveUp(up: boolean, expand: boolean, relocate: boolean) {
    const grab = grabs.furthestGrab(up);
    grab?.redraw_moveup(up, expand, relocate);
    if (relocate) {
      await cloud.updateAllNeedy();
    }
  }

  ////////////////////////////////////
  //         RELATIONSHIPS          //
  ////////////////////////////////////

  async relationships_deleteAllForThing(thing: Thing) {
    const array = hierarchy.relationshipsByIDFrom[thing.id];
    if (array) {
      for (const relationship of array) {
        await cloud.relationship_delete(relationship);
      }
    }
  }

}

export const editor = new Editor();