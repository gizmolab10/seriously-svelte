export default class Idea {
  grab: boolean;
  title: string;
  color: string;
  trait: string | null;
  parent: Idea | null;

  constructor(title = 'Idea', color = 'black', grab = false, trait = 's') {
    this.grab = grab;
    this.title = title;
    this.color = color;
    this.trait = trait;
    this.parent = null;
  };
}
