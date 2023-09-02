import { grabs, Basis, dbDispatch, Hierarchy, signal, Signals, constants, Predicate, normalizeOrderOf } from '../common/GlobalImports';
import { grabbedIDs, editingID, hereID } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Basis {
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

  constructor(id = Basis.newID, title = constants.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
    super(id, isRemotelyStored);
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

  copyInto(other: Thing) {
    other.title = this.title;
    other.color = this.color;
    other.trait = this.trait;
    other.order = this.order;
  }

  updateColorAttributes() {
    const borderStyle = this.isEditing ? 'dashed' : 'solid';
    const border = borderStyle + ' 1px ';
    const grab = border + this.revealColor(false);
    const hover = border + this.revealColor(true);
    this.borderAttribute = border;
    this.grabAttributes = grab;
    this.hoverAttributes = hover;
  }

  revealColor(isReveal: boolean): string {
    const flag = this.isGrabbed || this.isEditing || this.isExemplar;
    return (flag != isReveal) ? this.color : constants.backgroundColor;
  }

  log(message: string)            { console.log(message, this.description); }
  get fields(): Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
  get description():       string { return this.id + ' (\" ' + this.title + '\") '; }
  get hasChildren():      boolean { return this.hasPredicate(false); }
  get children():    Array<Thing> { const id = Predicate.idIsAParentOf; return dbDispatch.db.hierarchy.getThings_byIDPredicateToAndID(id, false, this.id); }
  get parents():     Array<Thing> { const id = Predicate.idIsAParentOf; return dbDispatch.db.hierarchy.getThings_byIDPredicateToAndID(id,  true, this.id); }
  get siblings():    Array<Thing> { return this.firstParent?.children ?? []; }
  get grandparent():        Thing { return this.firstParent?.firstParent ?? dbDispatch.db.hierarchy.root; }
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

  hasPredicate(asParents: boolean): boolean { return asParents ? this.parents.length > 0 : this.children.length > 0 }
  startEdit() { if (this != dbDispatch.db.hierarchy.root) { editingID.set(this.id); } }
  toggleGrab() { grabs.toggleGrab(this); }
  grabOnly() { grabs.grabOnly(this); }

  becomeHere() {
    if (this.hasChildren) {
      hereID.set(this.id);
      signal(Signals.childrenOf, this.id);
    };
  }

  normalizeOrder_recursive(remoteWrite: boolean) {
    const children = this.children;
    if (children && children.length > 0) {
      normalizeOrderOf(children, remoteWrite);
      for (const child of children) {
        child.normalizeOrder_recursive(remoteWrite);
      }
    }
  }

  async setOrderTo(newOrder: number, remoteWrite: boolean) {
    if (this.order != newOrder) {
      this.order = newOrder;
      const relationship = dbDispatch.db.hierarchy.getRelationship_whereParentIDEquals(this.id);
      if (relationship && (relationship.order != newOrder)) {
        relationship.order = newOrder;
        if (remoteWrite) {
          setTimeout(() => {
            (async () => {
              await dbDispatch.relationship_remoteWrite(relationship);
            })();
          }, 100);
        }
      }
    }
  }

  nextSibling(increment: boolean): Thing {
    const array = this.siblings;
    const index = array.indexOf(this);
    let siblingIndex = index.increment(increment, array.length)
    if (index == 0) {
      siblingIndex = 1;
    }
    return array[siblingIndex];
  }

  async traverse(applyTo: (thing: Thing) => Promise<boolean>) {
    if (!await applyTo(this)) {
      for (const progeny of this.children) {
        await progeny.traverse(applyTo);
      }
    }
    return this;
  }

  redraw_remoteMoveup(up: boolean, expand: boolean, relocate: boolean) {
    const siblings = this.siblings;
    if (!siblings || siblings.length == 0) {
        this.redraw_browseRight(true, up);
    } else {
      const index = siblings.indexOf(this);
      const newIndex = index.increment(!up, siblings.length);
      if (relocate) {
        const wrapped = up ? (index == 0) : (index == siblings.length - 1);
        const goose = ((wrapped == up) ? 1 : -1) * constants.orderIncrement;
        const newOrder =  newIndex + goose;
        siblings[index].setOrderTo(newOrder, true);
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

  redraw_browseRight(right: boolean, up: boolean = false) {
    const newGrab = right ? up ? this.lastChild : this.firstChild : this.firstParent;
    const newHere = right ? this : this.grandparent;
    editingID.set(null);
    newHere.becomeHere();
    newGrab?.grabOnly();
  }

}
