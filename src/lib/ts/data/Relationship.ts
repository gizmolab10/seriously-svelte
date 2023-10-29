import { dbDispatch } from '../common/GlobalImports';
import Airtable from 'airtable';
import Datum from './Datum';

export default class Relationship extends Datum {
	awaitingCreation: boolean;
	idTo: string;
	idFrom: string;
	idPredicate: string;
	order: number;
	dbType: string;

	constructor(id: string, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
		super(id, isRemotelyStored);
		this.awaitingCreation = false;
		this.idTo = idTo; // idTo is child
		this.idFrom = idFrom; // idFrom is parent
		this.idPredicate = idPredicate;
		this.dbType = dbDispatch.db.dbType;
		this.order = order;
	}

	log(message: string) { console.log(message, this.description); }
	thingTo_updateOrder(remoteWrite: boolean) { dbDispatch.db.hierarchy.thing_getForID(this.idTo)?.order_setTo(this.order, remoteWrite); }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
	get description(): string { return this.isRemotelyStored + ' ' + this.order + ' ' + this.id + ' '	+ dbDispatch.db.hierarchy.thing_getForID(this.idFrom)?.title + ' => ' + dbDispatch.db.hierarchy.thing_getForID(this.idTo)?.title; }
	get isValid(): boolean {
		if (this.idPredicate && this.idFrom && this.idTo) {
			return true;
		}
		return false;
	}

	order_setTo(newOrder: number, remoteWrite: boolean) {
		if (this.order != newOrder) {
			this.order = newOrder;
			this.thingTo_updateOrder(remoteWrite);
		}
	}

	async remoteWrite() {
		if (!this.awaitingCreation) {
			if (this.isRemotelyStored) {
				await dbDispatch.db.relationship_remoteUpdate(this);
			} else {
				await dbDispatch.db.relationship_remoteCreate(this);
			}
		}
	}

}