import { hierarchy } from './Hierarchy';
import Cloudable from './Cloudable';
import Airtable from 'airtable';

export enum RelationshipKind {
  appreciates = 'a',
  explainedBy = 'e',
  deoendsOn = 'd',
  parent = 'p',
}

export class Relationship extends Cloudable {
  kind: RelationshipKind;
  order: number;
  from: string;
  to: string;
  id: string;

  constructor(id: string, kind: RelationshipKind, from: string, to: string, order = 0) {
    super();
    this.id = id;
    this.to = to; // to is parent
    this.from = from; // from is child
    this.kind = kind;
    this.order = order;
  }

  get fields(): Airtable.FieldSet { return { kind: this.kind, from: [this.from], to: [this.to], order: this.order }; }
  get description(): string { return hierarchy.thing_forID(this.to)?.title + ' => ' + hierarchy.thing_forID(this.from)?.title; }
  

}