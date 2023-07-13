import { SignalKinds, entities, editingID, grabbing, signal } from "../common/Imports";

export default class TreeEditor {

  handleKeyDown = (event: KeyboardEvent): void => {
    if (event.type == 'keydown') {
      let OPTION = event.altKey;
      let key = event.key;
      switch (key) {
        case 'Tab': console.log('TAB', key); break;
        case 'Enter': this.beginEditing(); break;
        case 'ArrowUp': this.moveUpAndRedraw(true, OPTION); break;
        case 'ArrowDown': this.moveUpAndRedraw(false, OPTION); break;
      }
    }
  }

  beginEditing = () => {
    editingID.set(grabbing.firstGrabbedEntity?.id);
  }

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

export const treeEditor = new TreeEditor();
