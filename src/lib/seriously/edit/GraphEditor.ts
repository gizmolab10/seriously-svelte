import { entities, cloudID, Entity, editingID, grabbing, SignalKinds, signal } from "../common/Imports";

export default class GraphEditor {
  notEditing: boolean;

  constructor() {
    this.notEditing = false;

    setTimeout(() => {     // wait until the input element is fully instantiated and editingID is settled
      editingID.subscribe((id: string) => {
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
      }
    }
  }
  beginEditing = (event: KeyboardEvent) => {
    if (this.notEditing) {
      editingID.set(grabbing.firstGrabbedEntity?.id);
    } else {
      event.preventDefault();
    }
  }

  addChild = () => { console.log('CHILD'); }

  addSiblingAndRedraw = () => {
    let id = cloudID();
    let entity = new Entity(id, 'please, enter a title', 'blue', 't', 1.0);
    grabbing.grabOnly(entity);
    entities.all.push(entity);
    editingID.set(entity.id);
    signal([SignalKinds.graph, SignalKinds.widget], null);
    console.log('ADD:', entity.id);
    entities.createInCloud(entity);
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
    