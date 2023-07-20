import { Thing, things, grabbed } from './Imports';

export default class Grabbing {
  localGrabbed: Array<string>

  constructor() {
    this.localGrabbed = [];
    grabbed.subscribe((array) => {
      this.localGrabbed = array;
    })
  }

  get hasGrab(): boolean {
    return this.localGrabbed && this.localGrabbed.length > 0;
  }

  get firstGrab(): string | null {
    return this.hasGrab ? this.localGrabbed[0] : null;
  }

  get firstGrabbedThing(): Thing | null {
    return things.thingFor(this.firstGrab)
  }

  grab(thing: Thing) {
    grabbed.update(array => {
      array.push(thing.id);
      return array;
    });
  }

  grabOnly(thing: Thing) {
    grabbed.set([thing.id]);
  }

  ungrab(thing: Thing) {
    grabbed.update(array => {
      const index = array.indexOf(thing.id);

      if (index > -1) { // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
      }
      return array;
    });
  }

  isGrabbed(thing: Thing) {
    if (this.localGrabbed) {
      for (let id of this.localGrabbed) {
        if (id == thing.id) {
          return true;
        }
      }
    }

    return false;
  }

  toggleGrab(thing: Thing) {
    if (this.isGrabbed(thing)) {
      this.ungrab(thing);
    } else {
      this.grab(thing);
    }
  }

}

export const grabbing = new Grabbing();
