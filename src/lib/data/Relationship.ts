import { Predicate, hierarchy } from '../common/GlobalImports';
import Needable from './Needable';
import Airtable from 'airtable';

export class Relationship extends Needable {
  to: string;
  from: string;
  order: number;
  predicate: Predicate;

  constructor(id: string, predicate: Predicate, from: string, to: string, order = 0) {
    super(id);
    this.to = to; // to is child
    this.from = from; // from is parent
    this.order = order;
    this.predicate = predicate;
  }

  get fields(): Airtable.FieldSet { return { predicate: [this.predicate.id], from: [this.from], to: [this.to], order: this.order }; }
  get description(): string { return hierarchy.thing_forID(this.to)?.title + ' => ' + hierarchy.thing_forID(this.from)?.title; }

}