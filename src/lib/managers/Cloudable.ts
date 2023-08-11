export default class Cloudable {
  id: string;
  needsSave: boolean;
  needsCreate: boolean;
  needsDelete: boolean;

  constructor(id: string) {
    this.id = id;
    this.needsSave = false;
    this.needsCreate = false;
    this.needsDelete = false;
  }
}
