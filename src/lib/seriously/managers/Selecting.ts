import Idea from "../data/Ideas";

export default class Selecting {
  grabbed: string[];

  constructor() {
    this.grabbed = [];
  }
}

const selecting = new Selecting();

export function grab(idea: Idea) {
  selecting.grabbed.push(idea.id);
}

export function grabOnly(idea: Idea) {
  selecting.grabbed = [idea.id];
}

export function ungrab(idea: Idea) {
  const index = selecting.grabbed.indexOf(idea.id);

  if (index > -1) { // only splice array when item is found
    selecting.grabbed.splice(index, 1); // 2nd parameter means remove one item only
  }
}

export function isGrabbed(idea: Idea) {
  for (let grabbed of selecting.grabbed) {
    if (grabbed == idea.id) {
      return true;
    }
  }

  return false;
}

export function toggleGrab(idea: Idea) {
  if (isGrabbed(idea)) {
    ungrab(idea);
  } else {
    grab(idea);
  }
}