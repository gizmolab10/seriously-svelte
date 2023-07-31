import { get, cloud, Thing, hierarchy, grabbedIDs, signal, Signals, normalizeOrderOf, sortAccordingToOrder } from "../common/GlobalImports";

export default class Editor {
  here: Thing | null = null;
  constructor() {}

  cloud_redraw_deleteGrabs() {
    const ids = get(grabbedIDs);
    for (const id of ids) {
      const grab = hierarchy.thing_ID(id);
      if (grab != null && !grab.isEditing && this.here != null) {
        const siblings = grab.siblings;
        let index = siblings.indexOf(grab);
        siblings.splice(index, 1);
        if (siblings.length == 0) {
          const here = grab.grandparent ?? hierarchy.root;
          here.becomeHere();
          grab.firstParent.grabOnly();
        } else {
          if (index >= siblings.length) {
            index = siblings.length - 1;
          }
          if (index >= 0) {
            siblings[index].grabOnly();
          }
          this.here.pingHere();          
        }
        normalizeOrderOf(siblings);
        signal(Signals.widgets);
        cloud.thing_delete(grab);
        cloud.things_saveDirty();
        cloud.relationships_forThing_deleteAll(grab);
      }
    }
  }

  highestGrab(up: boolean) {
    const ids = get(grabbedIDs);
    let grabs = hierarchy.things_IDs(ids);
    sortAccordingToOrder(grabs);
    if (up) {
      return grabs[0];
    } else {
      return grabs[grabs.length - 1];
    }
  }

  cloud_redraw_moveRight(thing: Thing, right: boolean, relocate: boolean) {
    if (relocate) {
      thing.cloud_redraw_relocateRight(right);
    } else {
      thing.redraw_browseRight(right);
    }
  }
  
  cloud_redraw_moveUp(up: boolean, expand: boolean, relocate: boolean) {
    const thing = this.highestGrab(up);
    thing.redraw_moveup(up, expand, relocate);
    if (relocate) {
      cloud.things_saveDirty();
    }
  }

}

export const editor = new Editor();