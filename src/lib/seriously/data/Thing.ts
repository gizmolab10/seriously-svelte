import { grabbing, editingID, hereID, createCloudID, seriouslyGlobals, relationships, things, RelationshipKind, signal, SignalKinds, reassignOrdersOf } from '../common/Imports';
import Airtable from 'airtable';

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
  get firstParent(): Thing { return this.parents[0]; }
  get firstChild(): Thing { return this.children[0]; }
  get siblings(): Array<Thing> { return this.firstParent?.children ?? []; }

  get parents(): Array<Thing> { return this.thingsMatching(false); }
  get children(): Array<Thing> { return this.thingsMatching(true); }

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
  
  revealColor = (hovering: boolean): string => {
    const flag = grabbing.isGrabbed(this) || this.isEditing;
    return (flag != hovering) ? this.color : seriouslyGlobals.backgroundColor;
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

  browseRightAndRedraw = async (right: boolean) => {
    const grandparentID = this.firstParent?.firstParent?.id ?? null;
    if (right) {
      grabbing.grabOnly(this.firstChild);
      hereID.set(this.id);
      reassignOrdersOf(this.children);
      await things.updateThingsInCloud(this.children);
    } else if (grandparentID != null) {
      grabbing.grabOnly(this.firstParent);
      signal([SignalKinds.widget], null); // signal BEFORE setting hereID to avoid blink
      hereID.set(grandparentID);
    }
  }

}
