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
    if (flag != null && !flag) { this.needs = 0; }
    return was;
  }

  needsCreate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Needs.create); }
  needsDelete(flag: boolean | null = null) { return this.modifyNeedTo(flag, Needs.delete); }
  needsUpdate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Needs.update); }
  needsRemember(flag: boolean | null = null) { return this.modifyNeedTo(flag, Needs.remember); }


  // if false, turn it off

  modifyNeedTo(flag: boolean | null = null, bitMask: number) {
    const was = this.needs & bitMask;
    if (flag != null) {
      this.needs = flag ? this.needs | bitMask : this.needs & ~bitMask;  // if flag is true, turn needs on for bitMask
    }
    return was;
  }

}
