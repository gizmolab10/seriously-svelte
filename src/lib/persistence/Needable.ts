import { Needs } from "../common/GlobalImports";

export default class Needable {
  id: string;
  needs: Needs;

  constructor(id: string) {
    this.id = id;
    this.needs = Needs.none;
  }

  noNeeds(flag: boolean | null = null)  {
    const was = this.needs & Needs.none;
    if (flag) { this.needs |= flag ? Needs.none : 0; }
    return was;
  }

  needsRemind(flag: boolean | null = null) {
    const was = this.needs & Needs.remind;
    if (flag) { this.needs |= flag ? Needs.remind : 0; }
    return was;
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

  needsUpdate(flag: boolean | null = null) {
    const was = this.needs & Needs.update;
    if (flag) { this.needs |= flag ? Needs.update : 0; }
    return was;
  }

}
