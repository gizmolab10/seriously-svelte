import { get, hierarchy, cloud, normalizeOrderOf, lastGrabbedID, grabbedIDs, editingID, constants, RelationshipKind, signal, Signals } from '../common/GlobalImports';
import Cloudable from './Cloudable';
import Airtable from 'airtable';

export enum PrivacyKind {
  kEveryone = 'e',
  kInternal = 'i', // requires membership in a group
  kPersonal = 'p', // requires list of approved visitor
  kMeOnly   = 'm',
}

export default class Thing extends Cloudable {
  id: string;
  title: string;
  color: string;
  trait: string;
  order: number;
  isEditing: boolean;
  isGrabbed: boolean;

  copyFrom = (other: Thing) => {
    this.title = other.title;
    this.color = other.color;
    this.trait = other.trait;
    this.order = other.order;
  }

  constructor(id = cloud.newCloudID, title = constants.defaultTitle, color = 'blue', trait = 's', order = 0) {
    super();
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.order = order;
    this.isEditing = false;
    this.isGrabbed = false;

    editingID.subscribe((id: string | null) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });

    grabbedIDs.subscribe((ids: [string] | undefined) => {
      this.isGrabbed = (ids != undefined) && ids.includes(this.id); // executes whenever editingID changes
    });

  };

  get fields(): Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
  get  grabAttributes():   string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes():   string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute():   string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  get debugTitle():        string { return ' (\"' + this.title + '\") '; }

  get children():    Array<Thing> { return hierarchy.things_forKind_andID(RelationshipKind.isAChildOf, this.id, true); }
  get parents():     Array<Thing> { return hierarchy.things_forKind_andID(RelationshipKind.isAChildOf, this.id, false); }
  get siblings():    Array<Thing> { return this.firstParent?.children ?? []; }
  get grandparent():        Thing { return this.firstParent?.firstParent ?? hierarchy.root; }
  get lastChild():          Thing { return this.children.slice(-1)[0]; }
  get firstChild():         Thing { return this.children[0]; }
  get firstParent():        Thing { return this.parents[0]; }

  get hasChildren():      boolean { return this.hasRelationshipKind(false); }

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

  hasRelationshipKind = (asParents: boolean): boolean => { return asParents ? this.parents.length > 0 : this.children.length > 0 }
  toggleGrab = () => { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }
  editTitle = () => { editingID.set(this.id); }
  
  becomeHere = () => { 
    if (this.hasChildren) { 
      hierarchy.here = this;
      signal(Signals.here);
    };
  }

  setOrderTo = (newOrder: number) => {
    if (this.order != newOrder) {
      this.order = newOrder;
      const relationship = hierarchy.relationship_parentTo(this.id);
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

  grabOnly = () => {
    grabbedIDs.set([this.id]);
    lastGrabbedID.set(this.id);
    signal(Signals.grab);
  }

  grab = () => {
    grabbedIDs.update((array) => {
      if (array.indexOf(this.id) == -1) {
        array.push(this.id);  // only add if not already added
        lastGrabbedID.set(this.id);
      }
      return array;
    });
    signal(Signals.grab);
  }

  ungrab = () => {
    let nextGrabbedID: (string | null) = null;
    grabbedIDs.update((array) => {
      const index = array.indexOf(this.id);
      if (index != -1) {        // only splice array when item is found
        array.splice(index, 1); // 2nd parameter means remove one item only
      }
      nextGrabbedID = array.slice(-1)[0];
      return array;
    });
    if (get(lastGrabbedID) == this.id) {  // TODO: grab the top most of grabbed siblings
      lastGrabbedID.update(() => {
        return nextGrabbedID;
      })
    }
    signal(Signals.grab);
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
        this.redraw_browseRight(true, up);
    } else {
      const index = siblings.indexOf(this);
      const newIndex = index.increment(!up, siblings.length);
      if (relocate) {
        const wrapped = up ? (index == 0) : (index == siblings.length - 1);
        const goose = (wrapped ? -1 : 1) * (up ? -1 : 1);
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
    }
  }

  redraw_browseRight = (right: boolean, up: boolean = false) => {
    const newGrab = right ? up ? this.lastChild : this.firstChild : this.firstParent;
    const newHere = right ? this : this.grandparent;
    newHere.becomeHere();
    newGrab?.grabOnly();
  }

}
