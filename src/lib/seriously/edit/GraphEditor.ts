import { things, Thing, hereID, editingID, createCloudID, swap, seriouslyGlobals, grabbing, SignalKinds, signal, relationships, RelationshipKind } from "../common/Imports";

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
      let key = event.key.toLowerCase();
      console.log('KEY:', key);
      let SHIFT = (event.key != key || event.shiftKey);
      if (this.isEditing) {
        switch (key) {
          case 'Enter':
          case 'Tab': event.preventDefault();     // destroy event, Title will handle it
        }
      } else {
        switch (key) {
          case ' ':
            console.log('CHILD');
            break;
          case 'd':
            console.log('DUPLICATE');
            break;
          case 'arrowup': this.moveUpAndRedraw(true, OPTION); break;
          case 'arrowdown': this.moveUpAndRedraw(false, OPTION); break;
          case 'arrowleft':
            let parentID = thing?.firstParent?.firstParent?.id ?? null;
            if (parentID != null) {
              hereID.set(parentID);
            } else {
              console.log('LEFT:', thing?.firstParent);
            }
            break;
          case 'tab':
            this.addSiblingAndRedraw(); // Title also makes this call
            break;
          case 'enter': 
            editingID.set(id);
            break;
          case 'delete':
          case 'backspace':
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
              signal([SignalKinds.relayout, SignalKinds.widget], null);
              await relationships.deleteRelationshipsFromCloudFor(thing);
              await things.deleteThingFromCloud(thing);
            }
            break;
          }
      }
    }
  }

  async addSiblingAndRedraw() {
    const parentID = grabbing.firstGrabbedThing?.firstParent?.id ?? seriouslyGlobals.rootID;
    const sibling = new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    grabbing.grabOnly(sibling);
    editingID.set(sibling.id);
    await relationships.createAndSaveUniqueRelationshipMaybe(RelationshipKind.parent, sibling.id, parentID);
    signal([SignalKinds.relayout, SignalKinds.widget], null);
    await things.createThingInCloud(sibling);
  }

  moveUpAndRedraw = async (up: boolean, relocate: boolean) => {
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
            things.reassignOrdersOf(siblings);
            signal([SignalKinds.relayout, SignalKinds.widget], null);
            await things.updateThingsInCloud(siblings);
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
    