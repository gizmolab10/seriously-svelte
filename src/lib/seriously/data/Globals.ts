class Globals {
  public backgroundColor: string;
  public highlightColor: string;
  public defaultTitle: string;

  constructor() {
    this.backgroundColor = 'white';
    this.highlightColor = '#9e7daa';
    this.defaultTitle = 'Please, enter a title';
  }
}

export const seriouslyGlobals = new Globals();
