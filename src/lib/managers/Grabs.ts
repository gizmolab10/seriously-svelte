import { get, Thing, hierarchy, grabbedIDs, lastUngrabbedID, signal, Signals, sortAccordingToOrder } from "../common/GlobalImports";

export default class Grabs {
  grabbed: Thing[] | null = null;

  constructor() {
    grabbedIDs.subscribe((ids: string[] | undefined) => { // executes whenever grabbedIDs changes
      if (ids != undefined) {
        this.grabbed = [];
        for (const id of ids) {
          const thing = hierarchy.thing_forID(id)
          if (thing != null) {
            this.grabbed.push(thing);
          }
        }
      }
    });
  };

  get lastGrabbedID(): string | null { return this.grabbedThing?.id ?? null; }
  toggleGrab = (thing: Thing) => { if (thing.isGrabbed) { this.ungrab(thing); } else { this.grab(thing); } }
  
  get grabbedThing(): (Thing | null) {
    if (this.grabbed != null) {
      return this.grabbed.slice(-1)[0]
    }
    return null;
  }

  grabOnly = (thing: Thing) => {
    lastUngrabbedID.set(this.lastGrabbedID);
    grabbedIDs.set([thing.id]);
  }

  grab = (thing: Thing) => {
    grabbedIDs.update((array) => {
      if (array.indexOf(thing.id) == -1) {
        array.push(thing.id);  // only add if not already added
      }
      return array;
    });
  }

  ungrab = (thing: Thing) => {
    lastUngrabbedID.set(this.lastGrabbedID);
    let nextGrabbedID: (string | null) = null;
    const rootID = hierarchy.rootID;
    grabbedIDs.update((array) => {
      const index = array.indexOf(thing.id);
      if (index != -1) {        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
      }
      if (array.length == 0 && rootID != null) {
        array.push(rootID);
      }
      nextGrabbedID = array.slice(-1)[0];
      return array;
    });
    if (get(grabbedIDs).length == 0) {
      hierarchy.root?.grabOnly();
    }
  }

  highestGrab(up: boolean) {
    const ids = get(grabbedIDs);
    let grabs = hierarchy.things_forIDs(ids);
    sortAccordingToOrder(grabs);
    if (up) {
      return grabs[0];
    } else {
      return grabs[grabs.length - 1];
    }
  }

}

export const grabs = new Grabs();