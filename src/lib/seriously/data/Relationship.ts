import Airtable from 'airtable';

export enum RelationshipKind {
  appreciates = 'a',
  explainedBy = 'e',
  deoendsOn = 'd',
  parent = 'p',
}

export class Relationship {
  kind: RelationshipKind;
  from: string;
  to: string;
  id: string;
  isDirty: boolean;

  constructor(id: string, kind: RelationshipKind, from: string, to: string) {
    this.kind = kind;
    this.from = from; // from is child
    this.to = to; // to is parent
    this.id = id;
    this.isDirty = false;
  }

  get fields(): Airtable.FieldSet { return { id: this.id, kind: this.kind, from: this.from, to: this.to }; }
  
}