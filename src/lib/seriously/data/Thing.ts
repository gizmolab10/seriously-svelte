import { things, hereID, grabbedIDs, editingID, moveElementWithin, createCloudID, seriouslyGlobals, relationships, Relationship, RelationshipKind, signal, SignalKinds, reassignOrdersOf } from '../common/GlobalImports';
import Airtable from 'airtable';

export enum PrivacyKind {
  kEveryone = 'e',
  kInternal = 'i', // requires membership in a group
  kPersonal = 'p', // requires list of approved visitor
  kMeOnly   = 'm',
}

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
      this.isGrabbed = ids?.includes(this.id) ?? false;
    });

    editingID.subscribe((id: string | null) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });

  };

  get fields(): Airtable.FieldSet { return { id: this.id, title: this.title, order: this.order, color: this.color, trait: this.trait }; }
  get  grabAttributes(): string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes(): string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute(): string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  get siblings(): Array<Thing> { return this.firstParent?.children ?? []; }
  get children(): Array<Thing> { return relationships.thingsForID(this.id, true, RelationshipKind.parent); }
  get parents(): Array<Thing> { return relationships.thingsForID(this.id, false, RelationshipKind.parent); }
  get firstParent(): Thing { return this.parents[0]; }
  get firstChild(): Thing { return this.children[0]; }
  get canExpand(): boolean { return this.children.length > 0; }

  grabOnly = () => { grabbedIDs.set([this.id]); }

  revealColor = (isReveal: boolean): string => {
    const flag = this.isGrabbed || this.isEditing;
    return (flag != isReveal) ? this.color : seriouslyGlobals.backgroundColor;
  }

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
  
  traverse = (applyTo : (thing: Thing) => boolean) : Thing | null => {
    for (const progeny of this.children) {
      if (applyTo(progeny)) {
        return progeny;
      } else {
        progeny.traverse(applyTo);
      }
    }
    return this;
  }

  addSiblingAndRedraw = () => {
    const parentID = this.firstParent?.id ?? seriouslyGlobals.rootID;
    const sibling = new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', 1.0);
    sibling.grabOnly();
    const relationship = relationships.createRelationship(RelationshipKind.parent, sibling.id, parentID);
    signal([SignalKinds.widget], null);
    editingID.set(sibling.id);
    relationships.createRelationshipInCloud(relationship);
    things.createThingInCloud(sibling);
  }

  nextSibling = (increment: boolean): Thing => {
    const array = this.siblings;
    const index = array.indexOf(this);
    const siblingIndex = index.increment(increment, array.length)
    return array[siblingIndex];
  }

  moveRightAndRedraw = (right: boolean, relocate: boolean) => {
    const grandparentID = this.firstParent?.firstParent?.id ?? null;
    if (relocate) {
      this.relocateRight(right, grandparentID);
    } else {
      this.browseRight(right, grandparentID);
    }
    // alert('HORIZONTAL => RELAYOUT');
    signal([SignalKinds.relayout], null);
  }

  browseRight = (right: boolean, grandparentID: string) => {
    const grabID = right ? this.firstChild : this.firstParent;
    const hereID = right ? this.id : grandparentID;
    grabID.grabOnly();
    signal([SignalKinds.widget], null); // signal BEFORE setting hereID to avoid blink
    hereID.set(hereID);
  }

  relocateRight = (right: boolean, grandparentID: string) => {
    const id = right ? this.nextSibling(false).id : grandparentID;
    const matches = relationships.relationshipsMatchingKind(RelationshipKind.parent, false, this.id);
    const newParent = things.thingForID(id);
    this.isDirty = true;
    for (let index = 0; index < matches.length; index++) {
      const relationship = matches[index];
      relationship.to = id;
      relationship.isDirty = true;
    }
    if (newParent != null) {
      newParent.isDirty = true;
      signal([SignalKinds.widget], null); // signal BEFORE setting hereID to avoid blink
      hereID.set(id);
    }
  }

  moveUpAndRedraw = (up: boolean, relocate: boolean) => {
    const siblings = this.siblings;
    if (siblings != null) {
      const index = siblings.indexOf(this);
      const newIndex = index.increment(!up, siblings.length);
      if (newIndex.between(-1, siblings.length, false)) {
        const newGrab = siblings[newIndex];
        if (relocate) {
          moveElementWithin(siblings, index, newIndex);
          reassignOrdersOf(siblings);
          signal([SignalKinds.widget], null);
        } else {
          newGrab.grabOnly();
          signal([SignalKinds.widget], null);
        }
      }
    }
  }

}
