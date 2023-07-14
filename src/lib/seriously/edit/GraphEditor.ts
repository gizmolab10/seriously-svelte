import { SignalKinds, entities, editingID, grabbing, signal } from "../common/Imports";

export default class GraphEditor {

  handleKeyDown = (event: KeyboardEvent): void => {
    if (event.type == 'keydown') {
      let OPTION = event.altKey;
      let key = event.key;
      switch (key) {
        case ' ': this.addChild(); break;
        case 'Tab': this.addSibling(); break;
        case 'Enter': this.beginEditing(); break;
        case 'ArrowUp': this.moveUpAndRedraw(true, OPTION); break;
        case 'ArrowDown': this.moveUpAndRedraw(false, OPTION); break;
      }
    }
  }

  beginEditing = () => {
    editingID.set(grabbing.firstGrabbedEntity?.id);
  }

  addChild = () => { console.log('CHILD'); }

  addSibling = () => { console.log('SIBLING'); }

  moveUpAndRedraw = (up: boolean, relocate: boolean) => {
    if (grabbing.hasGrab) {
      const grab = grabbing.firstGrabbedEntity;
      if  (grab != undefined) {
        const all = entities.all;
        const index = all.indexOf(grab!);
        const newIndex = index.increment(!up, all.length - 1);
        const newGrab = all[newIndex];
        if (relocate) {
          console.log('relocate');
        } else {
          grabbing.grabOnly(newGrab);
        }

        signal([SignalKinds.widget], null);
      }
    }
  }

}

export const graphEditor = new GraphEditor();
    