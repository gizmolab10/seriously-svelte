import { hierarchy } from '../common/GlobalImports';

export class RelationshipKind {
  id: string;
  kind: string;

  constructor(id: string, kind: string) {
    this.id = id;
    this.kind = kind;
  }

    static get childOf(): RelationshipKind { return hierarchy.relationshipKindsByKind['childOf']; }

}