import { get, cloud, hereID, grabbedID, grabbedIDs, editingID, createCloudID, constants, RelationshipKind, signal, Signals, normalizeOrderOf, data } from '../common/GlobalImports';
import Airtable from 'airtable';

export enum PrivacyKind {
  kEveryone = 'e',
  kInternal = 'i', // requires membership in a group
  kPersonal = 'p', // requires list of approved visitor
  kMeOnly   = 'm',
}

export default class Thing {
  id: string;
  title: string;
  color: string;
  trait: string;
  order: number;
  isEditing: boolean;
  needsSave: boolean;

  copyFrom = (other: Thing) => {
    this.title = other.title;
    this.color = other.color;
    this.trait = other.trait;
    this.order = other.order;
  }

  constructor(id = createCloudID(), title = constants.defaultTitle, color = 'blue', trait = 's', order = 0) {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.order = order;
    this.needsSave = false;
    this.isEditing = false;
    this.setOrderTo(order); // copy into relationship

    editingID.subscribe((id: string | null) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });

  };

  get fields(): Airtable.FieldSet { return { id: this.id, title: this.title, color: this.color, trait: this.trait }; }
  get  grabAttributes():   string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes():   string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute():   string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  get children():    Array<Thing> { return data.things_kind_ID(RelationshipKind.parent, this.id, true); }
  get parents():     Array<Thing> { return data.things_kind_ID(RelationshipKind.parent, this.id, false); }
  get grandparent():        Thing { return this.firstParent?.firstParent ?? data.root; }
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
  thing_createAt = (order: number) => { return new Thing(createCloudID(), constants.defaultTitle, 'blue', 't', order); }
  grabOnly = () => { grabbedIDs.set([this.id]); grabbedID.set(null); grabbedID.set(this.id); }
  pingHere = () => { const saved = get(hereID); hereID.set(null); hereID.set(saved); }
  toggleGrab = () => { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }
  cloud_redraw_createChild = () => { this.cloud_redraw_thing_addAsChild(this.thing_createAt(-1)); }
  becomeHere = () => { if (this.hasChildren) { hereID.set(this.id) }; }
  edit = () => { editingID.set(this.id); }

  setOrderTo = (newOrder: number) => {
    if (this.order != newOrder) {
      this.order = newOrder;
      const relationship = data.relationship_firstParent_ID(this.id);
      if (relationship != null) {
        relationship.order = newOrder;
        relationship.needsSave = true;
      }
    }
  }

  revealColor = (isReveal: boolean): string => {
    const flag = this.isGrabbed || this.isEditing;
    return (flag != isReveal) ? this.color : constants.backgroundColor;
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

  redraw_moveup = (up: boolean, expand: boolean, relocate: boolean) => {
    const siblings = this.siblings;
    if (siblings == null || siblings.length == 0) {
        this.redraw_browseRight(true);
    } else {
      const index = siblings.indexOf(this);
      const newIndex = index.increment(!up, siblings.length);
      if (relocate) {
        const wrapped = up ? (index == 0) : (index == siblings.length - 1);
        const goose = (wrapped ? -0.1 : 1) * (up ? -1 : 1);
        const newOrder =  newIndex + goose;
        siblings[index].setOrderTo(newOrder);
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

  redraw_browseRight = (right: boolean) => {
    const grab = right ? this.firstChild : this.firstParent;
    const here = right ? this : this.grandparent;
    grab?.grabOnly();
    signal(Signals.widgets);   // signal BEFORE becomeHere to avoid blink
    here.becomeHere();
  }

  cloud_duplicate = async () => {
    const sibling = this.thing_createAt(this.order + 0.5);
    const parent = this.firstParent ?? things.root;
    sibling.copyFrom(this);
    sibling.order += 0.1
    parent.cloud_redraw_thing_addAsChild(sibling)
  }

  cloud_redraw_thing_addAsChild = async (child: Thing) => {
    await cloud.thing_insert(child); // for everything below, need to await child.id fetched from cloud
    const childID = child.id;
    const relationship = data.relationship_createUnique(RelationshipKind.parent, childID, this.id, child.order);
    data.relationships_refreshLookups();
    normalizeOrderOf(child.siblings);
    this.pingHere();
    child.edit();
    child.grabOnly();
    signal(Signals.widgets);
    cloud.things_saveDirty();
    // setTimeout(() => {
    //   relationships.relationship_insert(relationship);
    //   cloud.relationships_saveDirty();
    // }, 5000)
  }

  cloud_redraw_addChildTo = () => {
    this.cloud_redraw_createChild();
    this.pingHere();
  }

  cloud_redraw_relocateRight = async (right: boolean) => {
    const newParent = right ? this.nextSibling(false) : this.grandparent;
    if (newParent != null) {
      this.needsSave = true;     // order will change
      const matches = data.relationships_kind(RelationshipKind.parent, false, this.id);

      // alter the 'to' in ALL [?] the matching 'from' relationships
      // simpler than adjusting children or parents arrays
      // TODO: also match against the 'to' to the current parent
      // TODO: pass kind in ... to support editing different kinds of relationships

      for (let index = 0; index < matches.length; index++) {
        const relationship = matches[index];
        relationship.to = newParent.id;
        relationship.needsSave = true;                // save this new 'to'
      }

      data.relationships_refreshLookups();
      this.grabOnly();
      signal(Signals.widgets);                        // signal BEFORE becomeHere to avoid blink
      newParent.becomeHere();
      cloud.relationships_saveDirty();
      cloud.things_saveDirty();
    }
  }

}
