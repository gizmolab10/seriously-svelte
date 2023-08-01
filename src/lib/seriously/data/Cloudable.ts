export default class Cloudable {
  needsSave: boolean;
  needsDelete: boolean;

  constructor() {
    this.needsSave = false;
    this.needsDelete = false;
  }
}
