import { seriouslyGlobals } from "./Globals";
import { v4 as uuid } from 'uuid';

export default class Idea {
  id: string;
  title: string;
  color: string;
  trait: string;
  grabbed: boolean;
  parent: Idea | null;

  constructor(id = uuid().string, title = 'Idea', color = 'black', trait = 's', grabbed = false) {
    this.id = id;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.grabbed = grabbed;
    this.parent = null;
  };

  hoverColor(hovering: boolean) {
    return (this.grabbed != hovering) ? this.color : seriouslyGlobals.backgroundColor;
  }
}
