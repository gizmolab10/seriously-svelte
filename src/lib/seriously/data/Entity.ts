import Airtable from '../../../../node_modules/airtable/lib/airtable';
import { grabbing, editingID } from '../common/imports';
import { seriouslyGlobals } from './Globals';
import { derived } from 'svelte/store';
import { v4 as uuid } from 'uuid';

export default class Entity {
  id: string;
  title: string;
  color: string;
  trait: string;
  parent: Entity | null;

  constructor(id = uuid().string, title = 'Entity', color = 'black', trait = 's') {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.parent = null;
  };

  get fields(): Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
  get isEditing(): boolean { return derived(editingID, ($editingID: string) => $editingID == this.id) }
  get  grabAttributes(): string { return '3px ' + this.lineAttribute + ' ' + this.hoverColor(false); }
  get hoverAttributes(): string { return '3px ' + this.lineAttribute + ' ' + this.hoverColor(true); }
  get lineAttribute(): string { return editingID == this.id ? 'dashed' : 'solid'; }
  get isGrabbed(): boolean { return grabbing.isGrabbed(this); }
  grabOnly() { grabbing.grabOnly(this); }
  
  hoverColor(hovering: boolean): string {
    return (this.isGrabbed != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
