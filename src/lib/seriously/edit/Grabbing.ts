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

  get firstGrabbedEntity(): Thing | null {
    return things.thingFor(this.firstGrab)
  }

  grab(entity: Thing) {
    this.grabbed.push(entity.id);
  }

  grabOnly(entity: Thing) {
    this.grabbed = [entity.id];
  }

  ungrab(entity: Thing) {
    const index = this.grabbed.indexOf(entity.id);

    if (index > -1) { // only splice array when item is found
      this.grabbed.splice(index, 1); // 2nd parameter means remove one item only
    }
  }

  isGrabbed(entity: Thing) {
    for (let grabbed of this.grabbed) {
      if (grabbed == entity.id) {
        return true;
      }
    }

    return false;
  }

  toggleGrab(entity: Thing) {
    if (this.isGrabbed(entity)) {
      this.ungrab(entity);
    } else {
      this.grab(entity);
    }
  }

}

export const grabbing = new Grabbing();
