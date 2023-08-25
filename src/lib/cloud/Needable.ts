import { Need } from "../common/GlobalImports";

export default class Needable {
  id: string;
  needs: Need;

  constructor(id: string) {
    this.id = id;
    this.needs = Need.none;
  }

  get hasNeeds() : boolean { return !this.noNeeds() }

  noNeeds(flag: boolean | null = null)  {
    const was = this.needs == Need.none;
    if (flag != null && !flag) { this.needs = 0; }
    return was;
  }

  needsCreate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.create); }
  needsDelete(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.delete); }
  needsUpdate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.update); }
  needsRemember(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.remember); }


  // if false, turn it off

  modifyNeedTo(flag: boolean | null = null, bitMask: number) {
    const was = this.needs & bitMask;
    if (flag != null) {
      this.needs = flag ? this.needs | bitMask : this.needs & ~bitMask;  // if flag is true, turn needs on for bitMask
    }
    return was;
  }

}
