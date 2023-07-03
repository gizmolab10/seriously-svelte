import { grabbing } from '../managers/Grabbing';
import { editingID } from '../managers/Editing';
import { seriouslyGlobals } from './Globals';
import { v4 as uuid } from 'uuid';
import Airtable from '../../../../node_modules/airtable/lib/airtable';

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
  get isGrabbed(): boolean { return grabbing.isGrabbed(this); }
  get isEditable(): boolean { return editingID == this.id; }
  grabOnly() { grabbing.grabOnly(this); }
  
  hoverColor(hovering: boolean) {
    return (this.isGrabbed != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
