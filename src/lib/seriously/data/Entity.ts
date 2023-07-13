import Airtable from '../../../../node_modules/airtable/lib/airtable';
import { grabbing, editingID } from '../common/Imports';
import { seriouslyGlobals } from './Globals';
import { v4 as uuid } from 'uuid';

export default class Entity {
  id: string;
  title: string;
  color: string;
  trait: string;
  parent: Entity | null;
  isEditing: boolean;

  constructor(id = uuid().string, title = 'Entity', color = 'black', trait = 's') {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.parent = null;
    this.isEditing = false;

    editingID.subscribe((id: string) => {
      this.isEditing = id == this.id; // executes whenever editingID changes
    });
  };

  get fields(): Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
  get  grabAttributes(): string { return this.borderAttribute + this.revealColor(false); }
  get hoverAttributes(): string { return this.borderAttribute + this.revealColor(true); }
  get borderAttribute(): string { return (this.isEditing ? 'dashed' : 'solid') + ' 1px '; }
  
  // TODO: hover and grab are the same color when entity is grabbed

  revealColor = (hovering: boolean): string => {
    const flag = grabbing.isGrabbed(this) || this.isEditing;
    if (this.isEditing) {
      console.log(this, flag == hovering);
    }
    return (flag != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
