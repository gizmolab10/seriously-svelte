class Constants {
  public orderIncrement: number
  public backgroundColor: string;
  public highlightColor: string;
  public defaultTitle: string;

  constructor() {
    this.orderIncrement = 0.5;
    this.backgroundColor = 'white';
    this.highlightColor = '#9e7daa';
    this.defaultTitle = 'Please, enter a title';
  }
}

export const constants = new Constants();
