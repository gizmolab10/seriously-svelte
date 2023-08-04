import { get, Thing, hierarchy, grabbedIDs, signal, Signals } from "../common/GlobalImports";

export default class Grabs {

  constructor() {}

  get lastGrabbedID(): string { return get(grabbedIDs)?.slice(-1)[0]; }
  get grabbedThing(): (Thing | null) { return hierarchy.thing_forID(this.lastGrabbedID); }

  grabOnly = (thing: Thing) => {
    grabbedIDs.set([thing.id]);
    signal(Signals.grab);
  }

  grab = (thing: Thing) => {
    grabbedIDs.update((array) => {
      if (array.indexOf(thing.id) == -1) {
        array.push(thing.id);  // only add if not already added
      }
      return array;
    });
    signal(Signals.grab);
  }

  ungrab = (thing: Thing) => {
    let nextGrabbedID: (string | null) = null;
    grabbedIDs.update((array) => {
      const index = array.indexOf(thing.id);
      if (index != -1) {        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
      }
      nextGrabbedID = array.slice(-1)[0];
      return array;
    });
    signal(Signals.grab);
  }
  
  toggleGrab = (thing: Thing) => { if (thing.isGrabbed) { this.ungrab(thing); } else { this.grab(thing); } }

}

export const grabs = new Grabs();