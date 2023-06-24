import { seriouslyGlobals } from '../data/Globals';
import { isGrabbed } from '../managers/Selecting';
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

  hoverColor(hovering: boolean) {
    return (isGrabbed(this) != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
