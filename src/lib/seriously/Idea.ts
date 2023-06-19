import { seriouslyGlobals } from "./Globals";
import { v4 as uuid } from 'uuid';

export default class Idea {
  id: number;
  title: string;
  color: string;
  trait: string;
  grabbed: boolean;
  parent: Idea | null;

  constructor(title = 'Idea', color = 'black', trait = 's', grabbed = false) {
    this.id = uuid();
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.grabbed = grabbed;
    this.parent = null;
  };

  hoverColor(hovering: boolean) {
    return (this.grabbed == hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}

export const ideas = [
  new Idea('funny guy', 'green', 'b', true),
  new Idea('adventuring', 'red', 'c', false)
]