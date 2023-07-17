import { things, Thing, editingID, createCloudID, swap, seriouslyGlobals, grabbing, SignalKinds, signal } from "../common/Imports";

export default class GraphEditor {
  notEditing: boolean;

  constructor() {
    this.notEditing = false;

    setTimeout(() => {     // wait until the input element is fully instantiated and editingID is settled
      editingID.subscribe((id: string | null) => {
        this.notEditing = (id == null); // executes whenever editingID changes
      });
    }, 50);
  }

  handleKeyDown = (event: KeyboardEvent): void => {
    if (event.type == 'keydown') {
      let OPTION = event.altKey;
      let key = event.key;
      switch (key) {
        case ' ': this.addChild(); break;
        case 'Tab': event.preventDefault(); break; // let Title handle it
        case 'Enter': this.beginEditing(event); break;
        case 'ArrowUp': this.moveUpAndRedraw(true, OPTION); break;
        case 'ArrowDown': this.moveUpAndRedraw(false, OPTION); break;
        case 'Delete':
        case 'Backspace': this.deleteAndRedraw(); break;
      }
    }
  }

  redrawAll() {
    signal([SignalKinds.graph, SignalKinds.widget], null);
  }

  beginEditing = (event: KeyboardEvent) => {
    if (this.notEditing) {
      let id = grabbing.firstGrabbedEntity?.id ?? null;
      editingID.set(id);
    } else {
      event.preventDefault(); // destroy event
    }
  }

  addChild = () => { console.log('CHILD'); }

  deleteAndRedraw() {
    const entity = grabbing.firstGrabbedEntity;
    if (entity != null && !entity.isEditing && things.main != null) {
      const all = things.main?.children;
      things.deleteFromCloud(entity!);
      let index = all.indexOf(entity!);
      all.splice(index, 1);
      if (index >= all.length) {
        index = all.length - 1;
      }
      grabbing.grabOnly(all[index]);
      this.redrawAll();
    }
  }

  async addSiblingAndRedraw() {
    let entity = new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    grabbing.grabOnly(entity);
    things.main?.children.push(entity);
    await things.createInCloud(entity);
    console.log('ADD:', entity.id);
    editingID.set(entity.id);
    this.redrawAll();
  }

  moveUpAndRedraw = (up: boolean, relocate: boolean) => {
    if (grabbing.hasGrab) {
      const grab = grabbing.firstGrabbedEntity;
      if  (grab != null && things.main != null) {
        const all = things.main?.children;
        const index = all.indexOf(grab!);
        const newIndex = index.increment(!up, all.length - 1);
        const newGrab = all[newIndex];
        if (relocate) {
          swap(index, newIndex, all);
          this.redrawAll();
        } else {
          grabbing.grabOnly(newGrab);
          signal([SignalKinds.widget], null);
        }
      }
    }
  }

}

export const graphEditor = new GraphEditor();
    