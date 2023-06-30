import Idea from "../data/Idea";

export default class Selecting {
  grabbed: string[];

  constructor() {
    this.grabbed = [];
  }

  firstGrab(): string | undefined {
    // console.log('GRAB:', this.grabbed[0]);
    return (this.grabbed.length == 0) ? undefined : this.grabbed[0];
  }

  grab(idea: Idea) {
    this.grabbed.push(idea.id);
  }

  grabOnly(idea: Idea) {
    this.grabbed = [idea.id];
  }

  ungrab(idea: Idea) {
    const index = this.grabbed.indexOf(idea.id);

    if (index > -1) { // only splice array when item is found
      this.grabbed.splice(index, 1); // 2nd parameter means remove one item only
    }
  }

  isGrabbed(idea: Idea) {
    for (let grabbed of this.grabbed) {
      if (grabbed == idea.id) {
        return true;
      }
    }

    return false;
  }

  toggleGrab(idea: Idea) {
    if (this.isGrabbed(idea)) {
      this.ungrab(idea);
    } else {
      this.grab(idea);
    }
  }
}

export const selecting = new Selecting();
