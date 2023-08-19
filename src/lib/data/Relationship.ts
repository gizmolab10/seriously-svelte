import { Predicate, hierarchy } from '../common/GlobalImports';
import Needable from './Needable';
import Airtable from 'airtable';

export class Relationship extends Needable {
  IDTo: string;
  IDFrom: string;
  IDPredicate: string;
  order: number;

  constructor(id: string, predicate: string, from: string, to: string, order = 0) {
    super(id);
    this.IDTo = to; // to is child
    this.IDFrom = from; // from is parent
    this.IDPredicate = predicate;
    this.order = order;
  }

  get fields(): Airtable.FieldSet { return { predicate: [this.IDPredicate], from: [this.IDFrom], to: [this.IDTo], order: this.order }; }
  get description(): string { return hierarchy.thing_forID(this.IDFrom)?.title + ' => ' + hierarchy.thing_forID(this.IDTo)?.title; }

}