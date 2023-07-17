class Globals {
  public backgroundColor: string;
  public highlightColor: string;
  public mainThingTitle: string;
  public mainThingColor: string;
  public defaultTitle: string;

  constructor() {
    this.backgroundColor = 'white';
    this.highlightColor = '#9e7daa';
    this.mainThingTitle = 'seriously';
    this.mainThingColor = 'blue';
    this.defaultTitle = 'Please, enter a title';
  }
}

export const seriouslyGlobals = new Globals();
