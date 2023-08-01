import { hierarchy } from './Hierarchy';
import Airtable from 'airtable';

export enum RelationshipKind {
  appreciates = 'a',
  explainedBy = 'e',
  deoendsOn = 'd',
  parent = 'p',
}

export class Relationship {
  kind: RelationshipKind;
  order: number;
  from: string;
  to: string;
  id: string;
  needsSave: boolean;

  constructor(id: string, kind: RelationshipKind, from: string, to: string, order = 0) {
    this.kind = kind;
    this.from = from; // from is child
    this.to = to; // to is parent
    this.id = id;
    this.needsSave = false;
    this.order = order;
  }

  get fields(): Airtable.FieldSet { return { kind: this.kind, from: [this.from], to: [this.to], order: this.order }; }
  get fieldsWithID(): Airtable.FieldSet { return { id: this.id, kind: this.kind, from: [this.from], to: [this.to], order: this.order }; }
  get description(): string { return hierarchy.thing_forID(this.to)?.title + ' => ' + hierarchy.thing_forID(this.from)?.title; }
  

}