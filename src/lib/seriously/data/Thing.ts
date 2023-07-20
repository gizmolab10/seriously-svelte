import { grabbedIDs, editingID, hereID, createCloudID, seriouslyGlobals, relationships, things, RelationshipKind, signal, SignalKinds, reassignOrdersOf } from '../common/GlobalImports';
import Airtable from 'airtable';

export default class Thing {
  public id: string;
  public title: string;
  public order: number;
  public color: string;
  public trait: string;
  isGrabbed: boolean;
  isEditing: boolean;
  isDirty: boolean;

  constructor(id = createCloudID(), title = seriouslyGlobals.defaultTitle, color = 'blue', trait = 's', order = 0) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.color = color;
    this.trait = trait;
    this.isDirty = false;
    this.isEditing = false;
    this.isGrabbed = false;

    grabbedIDs.subscribe((ids) => {
      const newGrabbed =  ids?.includes(this.id) ?? false;
      if (this.isGrabbed != newGrabbed) {
        this.isGrabbed = newGrabbed;
        signal([SignalKinds.dot], null);
      }
    });

    editingID.subscribe((id: string | null) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });
  };

  get fields(): Airtable.FieldSet { return { id: this.id, title: this.title, order: this.order, color: this.color, trait: this.trait }; }
  get  grabAttributes(): string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes(): string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute(): string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  get firstParent(): Thing { return this.parents[0]; }
  get firstChild(): Thing { return this.children[0]; }
  get siblings(): Array<Thing> { return this.firstParent?.children ?? []; }

  get parents(): Array<Thing> { return this.thingsMatching(false); }
  get children(): Array<Thing> { return this.thingsMatching(true); }

  grabOnly = () => { grabbedIDs.set([this.id]); }

  toggleGrab() {
    grabbedIDs.update(array => {
      const index = array.indexOf(this.id);
      if (index == -1) {
        array.push(this.id);
      } else {                  // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only  
      }
      return array;
    });
  }

  revealColor = (hovering: boolean): string => {
    const flag = this.isGrabbed || this.isEditing;
    return (flag != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }

  thingsMatching(to: boolean): Array<Thing> {
    const array = Array<Thing>()
    const ids = relationships.IDsOfKind(RelationshipKind.parent, to, this.id);
    for (const thing of things.thingsFor(ids)) {
      array.push(thing);
    }
    array.sort((a: Thing, b: Thing) => {
      return a.order - b.order
    })
    return array;
  }
  
  traverse = (applyTo : (thing: Thing) => boolean) : Thing | null => {
    for (let progeny of this.children) {
      if (applyTo(progeny)) {
        return progeny;
      } else {
        progeny.traverse(applyTo);
      }
    }
    return this;
  }

  addSiblingAndRedraw = async () => {
    const parentID = this.firstParent?.id ?? seriouslyGlobals.rootID;
    const sibling = new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    sibling.grabOnly();
    await relationships.createAndSaveUniqueRelationshipMaybe(RelationshipKind.parent, sibling.id, parentID);
    signal([SignalKinds.widget], null);
    editingID.set(sibling.id);
    await things.createThingInCloud(sibling);
  }

  moveRightAndRedraw = async (right: boolean, relocate: boolean) => {
    const grandparentID = this.firstParent?.firstParent?.id ?? null;
    if (relocate) {

    } else if (right) {
      this.firstChild.grabOnly();
      hereID.set(this.id);
      reassignOrdersOf(this.children);
      await things.updateThingsInCloud(this.children);
    } else if (grandparentID != null) {
      this.firstParent.grabOnly();
      signal([SignalKinds.widget], null); // signal BEFORE setting hereID to avoid blink
      hereID.set(grandparentID);
    }
  }

}
