import { grabs, cloud, hierarchy, normalizeOrderOf, signal, Signals, constants, Predicate } from '../common/GlobalImports';
import { grabbedIDs, editingID, hereID } from '../managers/State';
import Needable from '../persistence/Needable';
import Airtable from 'airtable';

export default class Thing extends Needable {
  title: string;
  color: string;
  trait: string;
  order: number;
  titlePadding = 0;
  isEditing = false;
  isGrabbed = false;
  isExemplar = false;
  grabAttributes = '';
  hoverAttributes = '';
  borderAttribute = '';

  copyFrom = (other: Thing) => {
    this.title = other.title;
    this.color = other.color;
    this.trait = other.trait;
    this.order = other.order;
  }

  constructor(id = cloud.newCloudID, title = constants.defaultTitle, color = 'blue', trait = 's', order = 0) {
    super(id);
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.order = order;

    this.updateColorAttributes();

    editingID.subscribe((id: string | null) => { // executes whenever editingID changes
      const isEditing = (id == this.id);
      if (this.isEditing != isEditing) {
        this.isEditing = isEditing;
        this.updateColorAttributes();
      }
    });

    grabbedIDs.subscribe((ids: string[] | undefined) => { // executes whenever grabbedIDs changes
      const isGrabbed = (ids != undefined) && ids.includes(this.id);
      if (this.isGrabbed != isGrabbed) {
        this.isGrabbed = isGrabbed;
        this.updateColorAttributes();
      }
    });
  };

  updateColorAttributes = () => {
    const borderStyle = this.isEditing ? 'dashed' : 'solid';
    const border = borderStyle + ' 1px ';
    const grab = border + this.revealColor(false);
    const hover = border + this.revealColor(true);
    this.borderAttribute = border;
    this.grabAttributes = grab;
    this.hoverAttributes = hover;
  }

  revealColor = (isReveal: boolean): string => {
    const flag = this.isGrabbed || this.isEditing || this.isExemplar;
    return (flag != isReveal) ? this.color : constants.backgroundColor;
  }

  get fields(): Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
  get debugTitle():        string { return ' (\"' + this.title + '\") '; }
  get hasChildren():      boolean { return this.hasPredicate(false); }
  get children():    Array<Thing> { return hierarchy.things_byIDPredicateToAndID(Predicate.idIsAParentOf, false, this.id); }
  get parents():     Array<Thing> { return hierarchy.things_byIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
  get siblings():    Array<Thing> { return this.firstParent?.children ?? []; }
  get grandparent():        Thing { return this.firstParent?.firstParent ?? hierarchy.root; }
  get lastChild():          Thing { return this.children.slice(-1)[0]; }
  get firstChild():         Thing { return this.children[0]; }
  get firstParent():        Thing { return this.parents[0]; }

  get ancestors(): Array<Thing> {
    const array = [];
    let thing: Thing = this;
    while (thing) {
      array.push(thing);
      thing = thing.firstParent;
    }
    array.reverse();
    return array;
  }

  hasPredicate = (asParents: boolean): boolean => { return asParents ? this.parents.length > 0 : this.children.length > 0 }
  startEdit = () => { if (this != hierarchy.root) { editingID.set(this.id); } }
  toggleGrab = () => { grabs.toggleGrab(this); }
  grabOnly = () => { grabs.grabOnly(this); }

  becomeHere = () => {
    if (this.hasChildren) {
      hereID.set(this.id);
      signal(Signals.childrenOf, this.id);
    };
  }

  order_normalizeRecursive = () => {
    const children = this.children;
    if (children && children.length > 0) {
      normalizeOrderOf(children);
      for (const child of children) {
        child.order_normalizeRecursive();
      }
    }
  }

  setOrderTo = (newOrder: number) => {
    if (this.order != newOrder) {
      this.order = newOrder;
      const relationship = hierarchy.relationship_parentTo(this.id);
      if (relationship) {
        relationship.order = newOrder;
        relationship.needsUpdate(true);
      }
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

  markNeedsDelete = () => {
    hierarchy.relationships_allMarkNeedDeleteForThing(this);
    this.needsDelete(true);
  }

  traverse = (applyTo : (thing: Thing) => boolean) : Thing | null => {
    if (!applyTo(this)) {
      for (const progeny of this.children) {
        progeny.traverse(applyTo);
      }
    }
    return this;
  }

  redraw_moveup = (up: boolean, expand: boolean, relocate: boolean) => {
    const siblings = this.siblings;
    if (!siblings || siblings.length == 0) {
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
        signal(Signals.childrenOf, this.firstParent.id);
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
    editingID.set(null);
    newHere.becomeHere();
    newGrab?.grabOnly();
  }

}
