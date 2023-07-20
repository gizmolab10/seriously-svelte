import { grabbing, editingID, createCloudID, seriouslyGlobals, relationships, things, RelationshipKind } from '../common/Imports';
import Airtable from 'airtable';

export default class Thing {
  public id: string;
  public title: string;
  public color: string;
  public trait: string;
  public order: number;
  isEditing: boolean;
  isDirty: boolean;

  constructor(id = createCloudID(), title = seriouslyGlobals.defaultTitle, color = 'blue', trait = 's', order = 0) {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.order = order;
    this.isDirty = false;
    this.isEditing = false;

    editingID.subscribe((id: string | null) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });
  };

  get fields(): Airtable.FieldSet { return { id: this.id, title: this.title, color: this.color, trait: this.trait, order: this.order }; }
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

}
