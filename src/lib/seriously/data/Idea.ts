import { seriouslyGlobals } from '../data/Globals';
import { grabbing } from '../managers/Grabbing';
import { v4 as uuid } from 'uuid';

export default class Idea {
  id: string;
  title: string;
  color: string;
  trait: string;
  parent: Idea | null;

  constructor(id = uuid().string, title = 'Idea', color = 'black', trait = 's') {
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
