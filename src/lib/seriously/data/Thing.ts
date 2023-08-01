import { get, hierarchy, cloud, normalizeOrderOf, grabbedID, grabbedIDs, editingID, constants, RelationshipKind, signal, Signals } from '../common/GlobalImports';
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

  constructor(id = cloud.newCloudID, title = constants.defaultTitle, color = 'blue', trait = 's', order = 0) {
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
  get debugTitle():        string { return ' (\"' + this.title + '\") '; }

  get children():    Array<Thing> { return hierarchy.things_forKind_andID(RelationshipKind.parent, this.id, true); }
  get parents():     Array<Thing> { return hierarchy.things_forKind_andID(RelationshipKind.parent, this.id, false); }
  get siblings():    Array<Thing> { return this.firstParent?.children ?? []; }
  get grandparent():        Thing { return this.firstParent?.firstParent ?? hierarchy.root; }
  get firstChild():         Thing { return this.children[0]; }
  get firstParent():        Thing { return this.parents[0]; }

  get isGrabbed():        boolean { return get(grabbedIDs).includes(this.id); }
  get hasChildren():      boolean { return this.hasRelationships(false); }

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
  grabOnly = () => { grabbedIDs.set([this.id]); grabbedID.set(null); grabbedID.set(this.id); }
  toggleGrab = () => { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }
  editTitle = () => { editingID.set(this.id); }

  becomeHere = () => { 
    if (this.hasChildren) { 
      hierarchy.here = this; 
      signal(Signals.graph);
    };
  }

  setOrderTo = (newOrder: number) => {
    if (this.order != newOrder) {
      this.order = newOrder;
      const relationship = hierarchy.relationship_firstParent_byID(this.id);
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
        this.firstParent.becomeHere();
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
    const newGrab = right ? this.firstChild : this.firstParent;
    const newHere = right ? this : this.grandparent;
    newGrab?.grabOnly();
    signal(Signals.widgets);   // signal BEFORE becomeHere to avoid blink
    newHere.becomeHere();
  }

}
