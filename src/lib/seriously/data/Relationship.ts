export enum RelationshipKind {
  child = 'c',
}

export class Relationship {
  kind: RelationshipKind;
  from: string;
  to: [string];

  constructor(kind: RelationshipKind, from: string, to: [string]) {
    this.kind = kind;
    this.from = from; // from is parent
    this.to = to; // to is child
  }
}
