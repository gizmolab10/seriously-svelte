import { hierarchy } from '../common/GlobalImports';

export class Predicate {
  id: string;
  kind: string;

  constructor(id: string, kind: string) {
    this.id = id;
    this.kind = kind;
  }

  static get idIsAParentOf(): string { return hierarchy.predicatesByKind['isAParentOf'].id; }

}