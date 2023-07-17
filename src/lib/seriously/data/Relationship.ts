import Airtable from 'airtable';

export enum RelationshipKind {
  child = 'c',
}

export class Relationship {
  id: string;
  kind: RelationshipKind;
  from: string;
  to: [string];

  constructor(id: string, kind: RelationshipKind, from: string, to: [string]) {
    this.id = id;
    this.kind = kind;
    this.from = from; // from is parent
    this.to = to; // to is child
  }

  get fields(): Airtable.FieldSet { return { id: this.id, kind: this.kind, from: this.from, to: this.to }; }
  
}
