import { hierarchy } from '../managers/Hierarchy';
import Needable from '../cloud/Needable';
import Airtable from 'airtable';

export class Relationship extends Needable {
  idTo: string;
  idFrom: string;
  idPredicate: string;
  order: number;

  constructor(id: string, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
    super(id, isRemotelyStored);
    this.idTo = idTo; // idTo is child
    this.idFrom = idFrom; // idFrom is parent
    this.idPredicate = idPredicate;
    this.order = order;
  }

  get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
  get description(): string { return this.needs + ' ' + this.order + ' ' + this.id + ' '  + hierarchy.getThing_forID(this.idFrom)?.title + ' => ' + hierarchy.getThing_forID(this.idTo)?.title; }
  get isValid(): boolean {
    if (this.idPredicate && this.idFrom && this.idTo) {
      return true;
    }
    return false;
  }

}