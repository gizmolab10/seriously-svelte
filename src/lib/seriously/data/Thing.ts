import { things, hereID, grabbedID, grabbedIDs, editingID, createCloudID, seriouslyGlobals, relationships, RelationshipKind, signal, Signals, normalizeOrderOf } from '../common/GlobalImports';
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
  needsSave: boolean;

  constructor(id = createCloudID(), title = seriouslyGlobals.defaultTitle, color = 'blue', trait = 's', order = 0) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.color = color;
    this.trait = trait;
    this.needsSave = false;
    this.isEditing = false;

    editingID.subscribe((id: string | null) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });

  };

  get fields(): Airtable.FieldSet { return { id: this.id, title: this.title, order: this.order, color: this.color, trait: this.trait }; }
  get  grabAttributes():   string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes():   string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute():   string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  get children():    Array<Thing> { return relationships.thingsForID(this.id, true, RelationshipKind.parent); }
  get parents():     Array<Thing> { return relationships.thingsForID(this.id, false, RelationshipKind.parent); }
  get siblings():    Array<Thing> { return this.firstParent?.children ?? []; }
  get isGrabbed():        boolean { return get(grabbedIDs).includes(this.id); }
  get hasChildren():      boolean { return this.hasRelationships(false); }
  get firstChild():         Thing { return this.children[0]; }
  get firstParent():        Thing { return this.parents[0]; }

  get ancestors(): Array<Thing> {
    const ancestors = [];
    let thing: Thing = this;
    while (thing != null) {
      ancestors.push(thing);
      thing = thing.firstParent;
    }
    ancestors.reverse();
    return ancestors;
  }

  hasRelationships = (asParents: boolean): boolean => { return asParents ? this.parents.length > 0 : this.children.length > 0 }
  createNewThing = (order: number) => { return new Thing(createCloudID(), seriouslyGlobals.defaultTitle, 'blue', 't', order); }
  addChild_refresh = () => { this.addChild_refresh_saveToCloud(this.createNewThing(-1)); }
  grabOnly = () => { grabbedIDs.set([this.id]); grabbedID.set(null); grabbedID.set(this.id); }
  pingHere = () => { const saved = get(hereID); hereID.set(null); hereID.set(saved); }
  toggleGrab = () => { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }
  becomeHere = () => { if (this.hasChildren) { hereID.set(this.id) }; }
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
    grabbedIDs.update((array) => {
      if (array.indexOf(this.id) == -1) {
        array.push(this.id);  // only add if not already added
        grabbedID.set(this.id);
      }
      return array;
    });
  }

  ungrab = () => {
    grabbedIDs.update((array) => {
      const index = array.indexOf(this.id);
      if (index != -1) {        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
      }
      return array;
    });
    if (get(grabbedID) == this.id) {  // TODO: grab the top most of grabbed siblings
      grabbedID.update(() => { return null; })
    }
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
    const sibling = this.createNewThing(this.order + 0.5);
    const parent = this.firstParent ?? things.root;
    sibling.copyFrom(this);
    parent.addChild_refresh_saveToCloud(sibling)
  }

  addChild_refresh_saveToCloud = async (child: Thing) => {
    await things.createThing_inCloud(child); // for everything below, need to await child.id fetched from cloud
    await relationships.createRelationship_save_inCloud(RelationshipKind.parent, child.id, this.id);
    child.grabOnly();
    child.edit();
    this.pingHere();
    signal(Signals.widgets);
    things.updateAllDirtyThings_inCloud();
  }

  moveUp_refresh = (up: boolean, expand: boolean, relocate: boolean) => {
    const siblings = this.siblings;
    if (siblings == null || siblings.length == 0) {
        this.moveRight_refresh(true, false);
    } else {
      const index = siblings.indexOf(this);
      const newIndex = index.increment(!up, siblings.length);
      if (relocate) {
        const wrapped = (Math.abs(newIndex - index) != 1);
        const goose = (wrapped ? -0.1 : 1) * (up ? -1 : 1);
        const newOrder =  newIndex + goose;
        siblings[index].order = newOrder;
        normalizeOrderOf(siblings);
        this.firstParent.pingHere();
      } else {
        const newGrab = siblings[newIndex];
        if (expand) {
          newGrab?.toggleGrab()
        } else {
          newGrab?.grabOnly();
        }
      }
      signal(Signals.widgets);
    }
  }

  moveRight_refresh = (right: boolean, relocate: boolean) => {
    const leftGrandparent = this.firstParent?.firstParent ?? things.root;
    if (relocate) {
      this.relocateRight(right, leftGrandparent);
    } else {
      this.browseRight(right, leftGrandparent);
    }
  }

  browseRight = (right: boolean, leftGrandparent: Thing) => {
    const grab = right ? this.firstChild : this.firstParent;
    const here = right ? this : leftGrandparent;
    grab?.grabOnly();
    signal(Signals.widgets);   // signal BEFORE becomeHere to avoid blink
    here.becomeHere();
  }

  relocateRight = async (right: boolean, leftGrandparent: Thing) => {
    const newParent = right ? this.nextSibling(false) : leftGrandparent;
    if (newParent != null) {
      this.needsSave = true;     // order will change
      const movingIoRoot = newParent == things.root;
      const movingFromRoot = this.firstParent == things.root;
      const matches = relationships.relationships_matchingKind(RelationshipKind.parent, false, this.id);

      // alter the 'to' in ALL [?] the matching 'from' relationships
      // simpler than adjusting children or parents arrays
      // TODO: also match against the 'to' to the current parent
      // TODO: pass kind in ... to support editing different kinds of relationships

      for (let index = 0; index < matches.length; index++) {
        const relationship = matches[index];
        if (movingIoRoot) {                           // relationship in cloud will be wrong on next launch
          await relationships.deleteRelationship_fromCloud(relationship, true);     // remove it from cloud
        }
        relationship.to = newParent.id;
        relationship.needsSave = true;                // save this new 'to'
        if (movingFromRoot) {
          relationships.addRelationship_toCloud(relationship); // it wasn't in the cloud
        }
      }

      relationships.reconstruct_lookupDictionaries();
      this.grabOnly();
      signal(Signals.widgets);                        // signal BEFORE becomeHere to avoid blink
      newParent.becomeHere();
    }
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
