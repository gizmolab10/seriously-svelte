import { Entity, entities } from '../common/imports';

export default class Grabbing {
  grabbed: string[];

  constructor() {
    this.grabbed = [];
  }

  hasGrab(): boolean {
    return this.grabbed.length > 0;
  }

  firstGrab(): string | undefined {
    return (this.grabbed.length == 0) ? undefined : this.grabbed[0];
  }

  firstGrabbedEntity(): Entity | undefined {
    return entities.entityFor(this.firstGrab())
  }

  grab(entity: Entity) {
    this.grabbed.push(entity.id);
  }

  grabOnly(entity: Entity) {
    this.grabbed = [entity.id];
  }

  ungrab(entity: Entity) {
    const index = this.grabbed.indexOf(entity.id);

    if (index > -1) { // only splice array when item is found
      this.grabbed.splice(index, 1); // 2nd parameter means remove one item only
    }
  }

  isGrabbed(entity: Entity) {
    for (let grabbed of this.grabbed) {
      if (grabbed == entity.id) {
        return true;
      }
    }

    return false;
  }

  toggleGrab(entity: Entity) {
    if (this.isGrabbed(entity)) {
      this.ungrab(entity);
    } else {
      this.grab(entity);
    }
  }

  debug(up: boolean) {
    if (this.grabbed.length > 0) {
      console.log('GRABS:', up, this.grabbed.map((id) => entities.entityFor(id)?.title));
    }
  }
}

export const grabbing = new Grabbing();
