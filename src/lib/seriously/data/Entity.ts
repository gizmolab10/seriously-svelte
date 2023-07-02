import { seriouslyGlobals } from './Globals';
import { grabbing } from '../managers/Grabbing';
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

  get isGrabbed(): boolean { return grabbing.isGrabbed(this); }

  hoverColor(hovering: boolean) {
    return (this.isGrabbed != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
