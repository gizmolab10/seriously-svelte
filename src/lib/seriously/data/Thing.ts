import { things, hereID, grabbedID, grabbedIDs, editingID, createCloudID, seriouslyGlobals, relationships, RelationshipKind, signal, signalMultiple, Signals, reassignOrdersOf } from '../common/GlobalImports';
import { get } from 'svelte/store';
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
  get isGrabbed():      boolean { return get(grabbedIDs).includes(this.id); }
  get hasChildren():    boolean { return this.hasRelationships(false); }
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
  pingGrabs = () => { console.log('PING:', this.title); if (!this.isGrabbed) { this.grab(); } else { this.ungrab(); setTimeout(() => { this.grab(); }, 10);; } }
  createNewThing = () => { return new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', -1); }
  addChild_refresh = () => { this.addChild_save_refresh(this.createNewThing()); }
  toggleGrab = () => { if (this.isGrabbed) { this.ungrab() } else { this.grab() } }
  becomeHere = () => { if (this.hasChildren) { hereID.set(this.id) }; }
  grabOnly = () => { grabbedIDs.set([this.id]); grabbedID.set(this.id); }
  edit = () => { editingID.set(this.id); }

  revealColor = (isReveal: boolean): string => {
    const flag = this.isGrabbed || this.isEditing;
    return (flag != isReveal) ? this.color : seriouslyGlobals.backgroundColor;
  }

  copyFrom = (other: Thing) => {
    this.title = other.title;
    this.color = other.color;
    this.trait = other.trait;
    this.order = other.order;
  }

  grab = () => {
    grabbedIDs.update(array => {
      if (array.indexOf(this.id) == -1) {
        array.push(this.id);  // only add if not already added
      }
      return array;
    });
  }

  ungrab = () => {
    grabbedIDs.update(array => {
      const index = array.indexOf(this.id);
      if (index != -1) {        // only splice array when item is found
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

  duplicate_refresh = async () => {
    const sibling = this.createNewThing();
    const parent = this.firstParent ?? things.root;
    sibling.order = this.order + 0.5;
    sibling.copyFrom(this);
    parent.addChild_save_refresh(sibling)
  }

  addChild_save_refresh = async (child: Thing) => {
    await things.createThing_inCloud(child); // need child's id for everything below
    await relationships.createRelationship_save_inCloud(RelationshipKind.parent, child.id, this.id);
    this.becomeHere();
    child.grabOnly();
    child.edit();
    signal(Signals.widget);
    things.updateAllDirtyThings_inCloud();
  }

  moveUp_refresh = (up: boolean, expand: boolean, relocate: boolean) => {
    const siblings = this.siblings;
    if (siblings != null) {
      const index = siblings.indexOf(this);
      const newIndex = index.increment(!up, siblings.length);
      if (newIndex.between(-1, siblings.length, false)) {
        if (relocate) {
          siblings[index].order = newIndex - 0.5
          signal(Signals.widget);
        } else {
          const newGrab = siblings[newIndex];
          if (expand) {
            newGrab.toggleGrab()
          } else {
            newGrab.grabOnly();
          }
          signal(Signals.widget);
        }
      }
    }
  }

  moveRight_refresh = (right: boolean, relocate: boolean) => {
    const grandparent = this.firstParent?.firstParent ?? things.root;
    if (relocate) {
      this.relocateRight(right, grandparent);
    } else {
      this.browseRight(right, grandparent);
    }
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
      signal(Signals.widget); // signal BEFORE setting hereID to avoid blink
      parent.becomeHere();
    }
  }

  browseRight = (right: boolean, grandparent: Thing) => {
    const grab = right ? this.firstChild : this.firstParent;
    const here = right ? this : grandparent;
    grab?.grabOnly();
    signal(Signals.widget); // signal BEFORE setting hereID to avoid blink
    here.becomeHere();
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
