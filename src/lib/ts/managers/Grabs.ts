import { get, Thing, Hierarchy, sortAccordingToOrder } from "../common/GlobalImports";
import { idsGrabbed } from './State';

export default class Grabs {
  hierarchy: Hierarchy;
  grabbed: Thing[] | null = null;
  cached_idsGrabbed: Array<string> = [];

  constructor(hierarchy: Hierarchy) {
    this.hierarchy = hierarchy;
    idsGrabbed.subscribe((ids: string[] | undefined) => { // executes whenever idsGrabbed changes

      // called when $dbType changes in Details
      // needs to stash idsGrabbed and idHere
      // in dbType subscribe, in dbDispatch
      // after db is set by updateDBForType
      // during construct hierarchy
      // with old/confusing value
      // it belongs in the previous db
      // should not be stored in new db

      if (ids && this.hierarchy.db.hasData) {
        this.grabbed = [];
        for (const id of ids) {
          const thing = this.hierarchy.getThing_forID(id)
          if (thing) {
            this.grabbed.push(thing);            
          }
        }
        if (this.grabbed.length > 0) { // check if any grabbed id is valid for this db
          this.updateCache_idsGrabbed(ids);
        }
      }
    });
  };

  get cached_titlesGrabbed(): Array<string> {
    const things = this.hierarchy.getThings_forIDs(this.cached_idsGrabbed)
    const titles = things.map((thing) => { return thing.title; });
    return titles;
  }

  get last_thingGrabbed(): (Thing | null) { return this.hierarchy.getThing_forID(this.last_idGrabbed); }
  toggleGrab = (thing: Thing) => { if (thing.isGrabbed) { this.ungrab(thing); } else { this.grab(thing); } }

  updateCache_idsGrabbed(ids: Array<string> | null = null) {
    const cache = ids ?? get(idsGrabbed);
    this.cached_idsGrabbed = cache;
  }

  get last_idGrabbed(): string | null {
    if (this.cached_idsGrabbed) {
      return this.cached_idsGrabbed.slice(-1)[0]
    }
    return null;
  }

  grabOnly = (thing: Thing) => {
    const ids = [thing.id]
    idsGrabbed.set(ids);
    this.updateCache_idsGrabbed(ids);
  }

  grab = (thing: Thing) => {
    idsGrabbed.update((array) => {
      if (array.indexOf(thing.id) == -1) {
        array.push(thing.id);  // only add if not already added
      }
      return array;
    });
    this.updateCache_idsGrabbed();
  }

  ungrab = (thing: Thing) => {
    let nextGrabbedID: (string | null) = null;
    const rootID = this.hierarchy.idRoot;
    idsGrabbed.update((array) => {
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
    const ids = get(idsGrabbed);
    this.updateCache_idsGrabbed(ids);
    if (ids.length == 0) {
      this.hierarchy.root?.grabOnly();
    }
  }

  furthestGrab(up: boolean) {
    const ids = get(idsGrabbed);
    if (ids) {
      let grabs = this.hierarchy.getThings_forIDs(ids);
      sortAccordingToOrder(grabs);
      if (up) {
        return grabs[0];
      } else if (this.hierarchy.grabs.grabbed) {
        return grabs[this.hierarchy.grabs.grabbed.length - 1];
      }
    }
    return this.hierarchy.root;
  }

}