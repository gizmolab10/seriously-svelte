import { hierarchy } from '../common/GlobalImports';

export class Predicates {
  id: string;
  kind: string;

  constructor(id: string, kind: string) {
    this.id = id;
    this.kind = kind;
  }

  static get isAChildOf(): Predicates { return hierarchy.PredicatessByKind['isAChildOf']; }

}