import { convertStringToArray } from '../common/Imports';
import Airtable from 'airtable';

export enum RelationshipKind {
  parent = 'p',
}

export class Relationship {
  id: string;
  kind: RelationshipKind;
  from: string;
  to: string;

  constructor(id: string, kind: RelationshipKind, from: string, to: string) {
    this.id = id;
    this.kind = kind;
    this.from = from; // from is child
    this.to = to; // to is parents
  }

  get fields(): Airtable.FieldSet { return { id: this.id, kind: this.kind, from: this.from, to: this.to }; }
  get toIDsAsArray(): Array<string> { return convertStringToArray(this.to); }
  
}