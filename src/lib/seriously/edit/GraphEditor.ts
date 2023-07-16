import { entities, Entity, editingID, createEntityID, swap, seriouslyGlobals, grabbing, SignalKinds, signal } from "../common/Imports";

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
    if (entity != null && !entity.isEditing) {
      entities.deleteFromCloud(entity!);
      let index = entities.all.indexOf(entity!);
      entities.all.splice(index, 1);
      if (index >= entities.all.length) {
        index = entities.all.length - 1;
      }
      grabbing.grabOnly(entities.all[index]);
      this.redrawAll();
    }
  }

  async addSiblingAndRedraw() {
    let entity = new Entity(createEntityID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    grabbing.grabOnly(entity);
    entities.all.push(entity);
    await entities.createInCloud(entity);
    console.log('ADD:', entity.id);
    editingID.set(entity.id);
    this.redrawAll();
  }

  moveUpAndRedraw = (up: boolean, relocate: boolean) => {
    if (grabbing.hasGrab) {
      const grab = grabbing.firstGrabbedEntity;
      if  (grab != null) {
        const all = entities.all;
        const index = all.indexOf(grab!);
        const newIndex = index.increment(!up, all.length - 1);
        const newGrab = all[newIndex];
        if (relocate) {
          swap(index, newIndex, entities.all);
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
    