import { Predicates, hierarchy } from '../common/GlobalImports';
import Cloudable from '../persistence/Cloudable';
import Airtable from 'airtable';

export class Relationship extends Cloudable {
  to: string;
  from: string;
  order: number;
  kind: Predicates;

  constructor(id: string, kind: Predicates, from: string, to: string, order = 0) {
    super(id);
    this.to = to; // to is parent
    this.from = from; // from is child
    this.kind = kind;
    this.order = order;
  }

  get fields(): Airtable.FieldSet { return { kind: [this.kind.id], from: [this.from], to: [this.to], order: this.order }; }
  get description(): string { return hierarchy.thing_forID(this.to)?.title + ' => ' + hierarchy.thing_forID(this.from)?.title; }

}