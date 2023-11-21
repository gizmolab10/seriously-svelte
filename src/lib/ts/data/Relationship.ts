import { debug, dbDispatch, DebugOption } from '../common/GlobalImports';
import Airtable from 'airtable';
import Datum from './Datum';

export default class Relationship extends Datum {
	idTo: string;
	idFrom: string;
	idPredicate: string;
	order: number;
	dbType: string;

	constructor(baseID: string, id: string | null, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.idTo = idTo; // idTo is child
		this.idFrom = idFrom; // idFrom is parent
		this.idPredicate = idPredicate;
		this.dbType = dbDispatch.db.dbType;
		this.order = order;
	}

	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
	get description(): string { return ' \"' + this.baseID + '\" ' + this.isRemotelyStored + ' ' + this.order + ' ' + this.id + ' '	+ dbDispatch.db.hierarchy.thing_getForID(this.idFrom)?.description + ' => ' + dbDispatch.db.hierarchy.thing_getForID(this.idTo)?.description; }
	get isValid(): boolean {
		if (this.idPredicate && this.idFrom && this.idTo) {
			return true;
		}
		return false;
	}

	log(option: DebugOption, message: string) {
		debug.log(option, message + ' ' + this.description);
	}

	async order_setTo(newOrder: number, remoteWrite: boolean) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			const thing = dbDispatch.db.hierarchy.thing_getForID(this.idTo);
			await thing?.order_setTo(newOrder, remoteWrite);
		}
	}

	async remoteWrite() {
		if (!this.awaitingCreation) {
			if (this.isRemotelyStored) {
				await dbDispatch.db.relationship_remoteUpdate(this);
			} else {
				await dbDispatch.db.relationship_remember_remoteCreate(this);
			}
		}
	}

}