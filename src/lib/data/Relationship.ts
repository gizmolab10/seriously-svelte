import { hierarchy } from '../managers/Hierarchy';
import Basis from './Basis';
import Airtable from 'airtable';

export class Relationship extends Basis {
  awaitingCreation: boolean;
  idTo: string;
  idFrom: string;
  idPredicate: string;
  order: number;

  constructor(id: string, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
    super(id, isRemotelyStored);
    this.awaitingCreation = false;
    this.idTo = idTo; // idTo is child
    this.idFrom = idFrom; // idFrom is parent
    this.idPredicate = idPredicate;
    this.order = order;
  }

  log(message: string) { console.log(message, this.description); }
  thingTo_updateOrder(remoteWrite: boolean) { hierarchy.getThing_forID(this.idTo)?.setOrderTo(this.order, remoteWrite); }
  get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
  get description(): string { return this.isRemotelyStored + ' ' + this.order + ' ' + this.id + ' '  + hierarchy.getThing_forID(this.idFrom)?.title + ' => ' + hierarchy.getThing_forID(this.idTo)?.title; }
  get isValid(): boolean {
    if (this.idPredicate && this.idFrom && this.idTo) {
      return true;
    }
    return false;
  }

}