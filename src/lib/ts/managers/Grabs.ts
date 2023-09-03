import { get, Thing, dbDispatch, sortAccordingToOrder } from "../common/GlobalImports";
import { grabbedIDs } from './State';

export default class Grabs {
  grabbed: Thing[] | null = null;
  cachedGrabbedIDs: Array<string> = [];

  constructor() {
    grabbedIDs.subscribe((ids: string[] | undefined) => { // executes whenever grabbedIDs changes
      if (ids && dbDispatch.db.hasData) {
        this.grabbed = [];
        for (const id of ids) {
          const thing = dbDispatch.db.hierarchy.getThing_forID(id)
          if (thing) {
            this.grabbed.push(thing);            
          }
        }
      }
    });
  };

  get lastGrabbedID(): string | null { return this.grabbedThing?.id ?? null; }
  toggleGrab = (thing: Thing) => { if (thing.isGrabbed) { this.ungrab(thing); } else { this.grab(thing); } }
  
  get grabbedThing(): (Thing | null) {
    if (this.grabbed) {
      return this.grabbed.slice(-1)[0]
    }
    return null;
  }

  grabOnly = (thing: Thing) => {
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
    let nextGrabbedID: (string | null) = null;
    const rootID = dbDispatch.db.hierarchy.rootID;
    grabbedIDs.update((array) => {
      const index = array.indexOf(thing.id);
      if (index != -1) {        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
      }
      if (array.length == 0 && rootID) {
        array.push(rootID);
      }
      nextGrabbedID = array.slice(-1)[0];
      return array;
    });
    if (get(grabbedIDs).length == 0) {
      dbDispatch.db.hierarchy.root?.grabOnly();
    }
  }

  furthestGrab(up: boolean) {
    const ids = get(grabbedIDs);
    if (ids) {
      let grabs = dbDispatch.db.hierarchy.getThings_forIDs(ids);
      sortAccordingToOrder(grabs);
      if (up) {
        return grabs[0];
      } else if (dbDispatch.db.hierarchy.grabs.grabbed) {
        return grabs[dbDispatch.db.hierarchy.grabs.grabbed.length - 1];
      }
    }
    return dbDispatch.db.hierarchy.root;
  }

}

export const grabs = new Grabs();