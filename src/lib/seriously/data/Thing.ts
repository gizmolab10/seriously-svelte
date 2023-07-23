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
  get children():  Array<Thing> { return relationships.thingsForID(this.id, true, RelationshipKind.parent); }
  get parents():   Array<Thing> { return relationships.thingsForID(this.id, false, RelationshipKind.parent); }
  get siblings():  Array<Thing> { return this.firstParent?.children ?? []; }
  get hasChildren():      boolean { return this.hasRelationships(false); }
  get firstChild():       Thing { return this.children[0]; }
  get firstParent():      Thing { return this.parents[0]; }

  get ellipsisTitle(): string {
    let title = this.title;
    const length = title.length;
    const segment = 7;
    if (length > segment * 2 + 3) {
      title = title.slice(0, segment) + ' ... ' + title.slice(length - segment, length);
    }
    return title;
  }

  hasRelationships = (asParents: boolean): boolean => { return asParents ? this.parents.length > 0 : this.children.length > 0 }
  grabOnly = () => { grabbedIDs.set([this.id]); }
  focus = () => { if (this.hasChildren) { hereID.set(this.id) }; }

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
    signal([SignalKinds.relayout, SignalKinds.widget], null);
    alert(sibling.firstParent.title);
    editingID.set(sibling.id);
    relationships.createRelationshipInCloud(relationship);
    things.createThingInCloud(sibling);
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

  moveRightAndRedraw = (right: boolean, relocate: boolean) => {
    const grandparent = this.firstParent?.firstParent ?? things.root;
    if (relocate) {
      this.relocateRight(right, grandparent);
    } else {
      this.browseRight(right, grandparent);
    }
    signal([SignalKinds.relayout], null);
  }

  relocateRight = (right: boolean, grandparent: Thing) => {
    const parent = right ? this.nextSibling(false) : grandparent;
    if (parent != null) {
      this.isDirty = true;
      parent.isDirty = true;
      const matches = relationships.relationshipsMatchingKind(RelationshipKind.parent, false, this.id);
      for (let index = 0; index < matches.length; index++) {
        const relationship = matches[index];
        relationship.to = parent.id;
        relationship.isDirty = true;
      }
      relationships.refreshLookups();
      this.grabOnly();
      signal([SignalKinds.widget], null); // signal BEFORE setting hereID to avoid blink
      parent.focus();
    }
  }

  browseRight = (right: boolean, grandparent: Thing) => {
    const grab = right ? this.firstChild : this.firstParent;
    const here = right ? this : grandparent;
    grab.grabOnly();
    signal([SignalKinds.widget], null); // signal BEFORE setting hereID to avoid blink
    here.focus();
  }

  nextSibling = (increment: boolean): Thing => {
    const array = this.siblings;
    const index = array.indexOf(this);
    let siblingIndex = index.increment(increment, array.length)
    if (index == 0) {
      siblingIndex = 1;
    }
    return array[siblingIndex];
  }

}
