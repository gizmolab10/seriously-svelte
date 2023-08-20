import { Needs } from "../common/GlobalImports";

export default class Needable {
  id: string;
  needs: Needs;

  constructor(id: string) {
    this.id = id;
    this.needs = Needs.synced;
  }

  needsCreate(flag: boolean | null = null) {
    const was = this.needs & Needs.create;
    if (flag) { this.needs |= flag ? Needs.create : 0; }
    return was;
  }
  
  needsDelete(flag: boolean | null = null) {
    const was = this.needs & Needs.delete;
    if (flag) { this.needs |= flag ? Needs.delete : 0; }
    return was;
  }

  needsSave(flag: boolean | null = null) {
    const was = this.needs & Needs.update;
    if (flag) { this.needs |= flag ? Needs.update : 0; }
    return was;
  }

}
