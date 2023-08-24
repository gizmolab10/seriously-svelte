import { Needs } from "../common/GlobalImports";

export default class Needable {
  id: string;
  needs: Needs;

  constructor(id: string) {
    this.id = id;
    this.needs = Needs.none;
  }

  get hasNeeds() : boolean { return !this.noNeeds() }

  noNeeds(flag: boolean | null = null)  {
    const was = this.needs == Needs.none;
    if (flag) { this.needs = 0; }
    return was;
  }

  needsRemember(flag: boolean | null = null) {
    const was = this.needs & Needs.remember;
    if (flag) { this.needs |= (flag ? Needs.remember : 0); }
    return was;
  }

  needsCreate(flag: boolean | null = null) {
    const was = this.needs & Needs.create;
    if (flag) { this.needs |= (flag ? Needs.create : 0); }
    return was;
  }
  
  needsDelete(flag: boolean | null = null) {
    const was = this.needs & Needs.delete;
    if (flag) { this.needs |= (flag ? Needs.delete : 0); }
    return was;
  }

  needsUpdate(flag: boolean | null = null) {
    const was = this.needs & Needs.update;
    if (flag) { this.needs |= (flag ? Needs.update : 0); }
    return was;
  }

}
