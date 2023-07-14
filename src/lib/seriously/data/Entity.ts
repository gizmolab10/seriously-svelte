import { Relatives, grabbing, editingID } from '../common/Imports';
import { seriouslyGlobals } from './Globals';
import { v4 as uuid } from 'uuid';
import Airtable from 'airtable';

export default class Entity {
  id: string;
  title: string;
  color: string;
  trait: string;
  order: number;
  relatives: Relatives | null;
  isEditing: boolean;

  constructor(id = uuid().string, title = 'Entity', color = 'black', trait = 's', order = 0) {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.order = order;
    this.relatives = null;
    this.isEditing = false;

    editingID.subscribe((id: string) => {
      this.isEditing = (id == this.id); // executes whenever editingID changes
    });
  };

  get fields(): Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait, order: this.order }; }
  get  grabAttributes(): string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes(): string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute(): string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  
  revealColor = (hovering: boolean): string => {
    const flag = grabbing.isGrabbed(this) || this.isEditing;
    return (flag != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
