import { Needs } from "../common/GlobalImports";

export default class Needable {
  id: string;
  needs: number;

  constructor(id: string) {
    this.id = id;
    this.needs = 0;
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
    const was = this.needs & Needs.save;
    if (flag) { this.needs |= flag ? Needs.save : 0; }
    return was;
  }

}
