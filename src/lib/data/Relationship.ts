import { hierarchy } from '../managers/Hierarchy';
import Needable from '../persistence/Needable';
import Airtable from 'airtable';

export class Relationship extends Needable {
  idTo: string;
  idFrom: string;
  idPredicate: string;
  order: number;

  constructor(id: string, idPredicate: string, idFrom: string, idTo: string, order = 0) {
    super(id);
    this.idTo = idTo; // idTo is child
    this.idFrom = idFrom; // idFrom is parent
    this.idPredicate = idPredicate;
    this.order = order;
  }

  get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
  get description(): string { return hierarchy.thing_forID(this.idFrom)?.title + ' => ' + hierarchy.thing_forID(this.idTo)?.title; }

}