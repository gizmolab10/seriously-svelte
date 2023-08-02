export default class Cloudable {
  needsSave: boolean;
  needsCreate: boolean;
  needsDelete: boolean;

  constructor() {
    this.needsSave = false;
    this.needsCreate = false;
    this.needsDelete = false;
  }
}
