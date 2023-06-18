export default class Idea {
  title: string;
  color: string;
  trait: string;
  grabbed: boolean;
  parent: Idea | null;

  constructor(title = 'Idea', color = 'black', trait = 's', grabbed = false) {
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.grabbed = grabbed;
    this.parent = null;
  }; 
}

export const ideas = [
  new Idea('funny guy', 'green', 'b', true),
  new Idea('adventuring', 'red', 'c', false)
]