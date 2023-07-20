import { things, Thing, hereID, editingID, createCloudID, swap, seriouslyGlobals, grabbing, SignalKinds, signal, relationships } from "../common/Imports";

export default class GraphEditor {
  isEditing: boolean;

  constructor() {
    this.isEditing = false;

    setTimeout(() => {     // wait until the input element is fully instantiated and editingID is settled
      editingID.subscribe((id: string | null) => {
        this.isEditing = (id != null); // executes whenever editingID changes
      });
    }, 50);
  }

  handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
    if (event.type == 'keydown') {
      const thing = grabbing.firstGrabbedThing;
      let id = grabbing.firstGrab ?? null;
      let OPTION = event.altKey;
      let key = event.key;
      if (this.isEditing) {
        switch (key) {
          case 'Enter':
          case 'Tab': event.preventDefault();     // destroy event, Title will handle it
        }
      } else {
        switch (key) {
          case ' ': console.log('CHILD'); break;
          case 'ArrowUp': this.moveUpAndRedraw(true, OPTION); break;
          case 'ArrowDown': this.moveUpAndRedraw(false, OPTION); break;
          case 'ArrowLeft':
            let parentID = thing?.firstParent?.firstParent?.id ?? null;
            if (parentID != null) {
              hereID.set(parentID);
            } else {
              console.log('LEFT:', thing?.firstParent);
            }
            break;
          case 'Tab':
            this.addSiblingAndRedraw(); // Title also makes this call
            break;
          case 'Enter': 
            editingID.set(id);
            break;
          case 'Delete':
          case 'Backspace':
            if (thing != null && !thing.isEditing && things.root != null) {
              const all = things.root?.children;
              let index = all.indexOf(thing);
              all.splice(index, 1);
              if (index >= all.length) {
                index = all.length - 1;
              }
              if (index >= 0) {
                grabbing.grabOnly(all[index]);
              }              
              this.redrawAll();
              await relationships.deleteRelationshipsFromCloudFor(thing);
              await things.deleteThingFromCloud(thing);
            }
            break;
          }
      }
    }
  }

  redrawAll() {
    signal([SignalKinds.graph, SignalKinds.widget], null);
  }

  async addSiblingAndRedraw() {
    const grab = grabbing.firstGrabbedThing ?? things.root;
    const sibling = new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    grabbing.grabOnly(sibling);
    grab?.children.push(sibling); // use focus, not root, create a relationship
    editingID.set(sibling.id);
    this.redrawAll();
    await things.createThingInCloud(sibling);
  }

  reassignOrdersOf(array: Array<Thing>) {
    var index = 1;
    for (const thing of array) {
      thing.order = index;
      console.log(thing.order, thing.title);
      index += 1;
    }    
  }

  moveUpAndRedraw = (up: boolean, relocate: boolean) => {
    if (grabbing.hasGrab) {
      const child = grabbing.firstGrabbedThing;
      const siblings = child?.siblings;
      if (siblings != null) {
        const index = siblings.indexOf(child!);
        const newIndex = index.increment(!up, siblings.length - 1);
        if (newIndex.between(-1, siblings.length, false)) {
          const newGrab = siblings[newIndex];
          if (relocate) {
            swap(index, newIndex, siblings);
            this.reassignOrdersOf(siblings);
            this.redrawAll();
            things.updateThingsInCloud(siblings);
          } else {
            grabbing.grabOnly(newGrab);
            signal([SignalKinds.widget], null);
          }
        }
      }
    }
  }

}

export const graphEditor = new GraphEditor();
    