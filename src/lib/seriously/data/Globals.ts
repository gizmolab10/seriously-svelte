class Globals {
  public backgroundColor: string;
  public highlightColor: string;
  public defaultTitle: string;
  public rootTitle: string;
  public rootColor: string;

  constructor() {
    this.backgroundColor = 'white';
    this.highlightColor = '#9e7daa';
    this.defaultTitle = 'Please, enter a title';
    this.rootTitle = 'seriously';
    this.rootColor = 'blue';
  }
}

export const seriouslyGlobals = new Globals();
