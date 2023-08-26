import { Need } from "../common/GlobalImports";

export default class Needable {
  id: string;
  needs = Need.none;
  cameFromRemote: boolean;

  constructor(id: string, cameFromRemote: boolean) {
    this.cameFromRemote = cameFromRemote;
    this.id = id;
  }

  get hasNeeds() : boolean { return !this.noNeeds() }

  noNeeds(flag: boolean | null = null)  {
    const was = this.needs == Need.none;
    if (flag != null && !flag) {
      if (this.needs & Need.create) {
        this.cameFromRemote = true;
      }
      this.needs = 0;
    }
    return was;
  }

  needsPushToRemote() {
    if (this.cameFromRemote) {
      this.needsUpdate(true);
    } else {
      this.needsCreate(true)
    }
  }

  needsCreate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.create); }
  needsDelete(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.delete); }
  needsUpdate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.update); }
  needsRemember(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.remember); }


  // if false, turn it off

  modifyNeedTo(flag: boolean | null = null, bitMask: Need) {
    const was = this.needs & bitMask;
    if (flag != null) {
      if (!flag && bitMask == Need.create) {
        this.cameFromRemote = true;
      }
      this.needs = flag ? this.needs | bitMask : this.needs & ~bitMask;  // if flag is true, turn needs on for bitMask
    }
    return was;
  }

}
