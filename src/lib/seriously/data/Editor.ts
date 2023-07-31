import { get, cloud, Thing, hierarchy, grabbedIDs, signal, Signals, normalizeOrderOf } from "../common/GlobalImports";

export default class Editor {
  constructor() {}

  redraw_moveup = (thing: Thing, up: boolean, expand: boolean, relocate: boolean) => {
    const siblings = thing.siblings;
    if (siblings == null || siblings.length == 0) {
        this.redraw_browseRight(thing, true);
    } else {
      const index = siblings.indexOf(thing);
      const newIndex = index.increment(!up, siblings.length);
      if (relocate) {
        const wrapped = up ? (index == 0) : (index == siblings.length - 1);
        const goose = (wrapped ? -0.1 : 1) * (up ? -1 : 1);
        const newOrder =  newIndex + goose;
        siblings[index].setOrderTo(newOrder);
        normalizeOrderOf(siblings);
        thing.firstParent.becomeHere();
      } else {
        const newGrab = siblings[newIndex];
        if (expand) {
          newGrab?.toggleGrab()
        } else {
          newGrab?.grabOnly();
        }
      }
      signal(Signals.widgets);
    }
  }

  redraw_browseRight = (thing: Thing, right: boolean) => {
    const newGrab = right ? thing.firstChild : thing.firstParent;
    const newHere = right ? thing : thing.grandparent;
    newGrab?.grabOnly();
    signal(Signals.widgets);   // signal BEFORE becomeHere to avoid blink
    newHere.becomeHere();
  }

}

export const editor = new Editor();