import { Thing, things } from '../common/Imports';

export default class Grabbing {
  grabbed: string[];

  constructor() {
    this.grabbed = [];
  }

  get hasGrab(): boolean {
    return this.grabbed.length > 0;
  }

  get firstGrab(): string | null {
    return (this.grabbed.length == 0) ? null : this.grabbed[0];
  }

  get firstGrabbedThing(): Thing | null {
    return things.thingFor(this.firstGrab)
  }

  grab(thing: Thing) {
    this.grabbed.push(thing.id);
  }

  grabOnly(thing: Thing) {
    this.grabbed = [thing.id];
  }

  ungrab(thing: Thing) {
    const index = this.grabbed.indexOf(thing.id);

    if (index > -1) { // only splice array when item is found
      this.grabbed.splice(index, 1); // 2nd parameter means remove one item only
    }
  }

  isGrabbed(thing: Thing) {
    for (let grabbed of this.grabbed) {
      if (grabbed == thing.id) {
        return true;
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
