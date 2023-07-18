import { grabbing, editingID, createCloudID, seriouslyGlobals } from '../common/Imports';
import Airtable from 'airtable';

export default class Thing {
  public id: string;
  public title: string;
  public color: string;
  public trait: string;
  public order: number;
  parents: Array<Thing>;
  children: Array<Thing>;
  isEditing: boolean;

  constructor(id = createCloudID(), title = seriouslyGlobals.defaultTitle, color = 'blue', trait = 's', order = 0) {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.order = order;
    this.parents = new Array<Thing>();
    this.children = new Array<Thing>();
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

  addChild(child: Thing) {
    this.children.push(child);
    child.parents.push(this);
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
