import Airtable from '../../../../node_modules/airtable/lib/airtable';
import { grabbing, editingID } from '../common/imports';
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
  get  grabAttributes(): string { return this.borderAttribute + this.hoverColor(false); }
  get hoverAttributes(): string { return this.borderAttribute + this.hoverColor(true); }
  get borderAttribute(): string { return this.isEditing ? 'dashed' : 'solid' + ' 1px '; }
  
  hoverColor(hovering: boolean): string {
    return (grabbing.isGrabbed(this) != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
