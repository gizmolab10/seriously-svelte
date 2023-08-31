import { get, grabs, Thing, cloud, signal, Signals, constants, hierarchy, Predicate, CreationFlag, normalizeOrderOf } from '../common/GlobalImports';
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
      this.here = hierarchy.getThing_forID(id);
    })
  }

  //////////////////////////
  //         ADD          //
  //////////////////////////

  async thing_redraw_remoteAddChildTo(parent: Thing) {
    const child = hierarchy.thing_runtimeCreateAt(-1);
    await this.thing_redraw_remoteAddAsChild(child, parent);
  }

  async thing_redraw_remoteDuplicate(thing: Thing) {
    const sibling = hierarchy.thing_runtimeCreateAt(thing.order + constants.orderIncrement);
    const parent = thing.firstParent ?? hierarchy.root;
    thing.copyInto(sibling);
    sibling.order += constants.orderIncrement
    await this.thing_redraw_remoteAddAsChild(sibling, parent);
  }

  async thing_redraw_remoteAddAsChild(child: Thing, parent: Thing) {
    const idPredicateIsAParentOf = Predicate.idIsAParentOf;
    const idRelationship = cloud.newCloudID;
    await cloud.thing_remoteCreate(child); // for everything below, need to await child.id fetched from cloud
    hierarchy.rememberThing(child);
    const relationship = await hierarchy.rememberRelationship_remoteCreate(idRelationship, idPredicateIsAParentOf, parent.id, child.id, child.order, CreationFlag.getRemoteID)
    normalizeOrderOf(parent.children);
    parent.becomeHere();
    child.startEdit();
    child.grabOnly();
    await cloud.relationship_remoteWrite(relationship);
  }

  ///////////////////////////
  //         MOVE          //
  ///////////////////////////

  async thing_redraw_remoteMoveRight(thing: Thing, right: boolean, relocate: boolean) {
    if (relocate) {
      await this.thing_redraw_remoteRelocateRight(thing, right);
    } else {
      thing.redraw_browseRight(right);
    }
  }

  async thing_redraw_remoteRelocateRight(thing: Thing, right: boolean) {
    const newParent = right ? thing.nextSibling(false) : thing.grandparent;
    if (newParent) {
      const parent = thing.firstParent;

      // alter the 'to' in ALL [?] the matching 'from' relationships
      // simpler than adjusting children or parents arrays
      // TODO: also match against the 'to' to the current parent
      // TODO: pass predicate in ... to support editing different kinds of relationships

      const relationship = hierarchy.getRelationship_whereParentIDEquals(thing.id);
      if (relationship) {
        relationship.idFrom = newParent.id;
        await cloud.relationship_remoteUpdate(relationship);
        thing.setOrderTo(-1);
      }

      hierarchy.relationships_refreshKnowns();     // so children and parent will see the newly relocated things
      normalizeOrderOf(newParent.children);         // refresh knowns first
      normalizeOrderOf(parent.children);
      thing.grabOnly();
      newParent.becomeHere();
      signal(Signals.childrenOf, newParent.id);     // so Children component will update
    }
  }

  async furthestGrab_redraw_remoteMoveUp(up: boolean, expand: boolean, relocate: boolean) {
    const grab = grabs.furthestGrab(up);
    grab?.redraw_remoteMoveup(up, expand, relocate);
  }

  /////////////////////////////
  //         DELETE          //
  /////////////////////////////

  async grabs_redraw_remoteDelete() {
    if (this.here) {
      for (const id of get(grabbedIDs)) {
        const grabbed = hierarchy.getThing_forID(id);
        if (grabbed && !grabbed.isEditing && this.here) {
          let newGrab = grabbed.firstParent;
          const siblings = grabbed.siblings;
          let index = siblings.indexOf(grabbed);
          siblings.splice(index, 1);
          if (siblings.length == 0) {
            grabbed.grandparent.becomeHere();
          } else {
            if (index >= siblings.length) {
              index = siblings.length - 1;
            }
            newGrab = siblings[index];
            normalizeOrderOf(grabbed.siblings);
          }
          await grabbed.traverse(async (child: Thing): Promise<boolean> => {
            await hierarchy.forgetRelationships_remoteDeleteAllForThing(child);
            await hierarchy.forgetThing_remoteDelete(child);
            return false; // continue the traversal
          });
          newGrab.grabOnly();
          signal(Signals.childrenOf, newGrab.firstParent.id); 
        }
      }
    }
  }

}

export const editor = new Editor();