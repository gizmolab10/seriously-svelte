import { k, Thing, debug, dbDispatch, DebugFlag } from '../common/GlobalImports';
import Airtable from 'airtable';
import Datum from '../structures/Datum';

export default class Relationship extends Datum {
	idPredicate: string;
	dbType: string;
	idFrom: string;
	order: number;
	idTo: string;

	constructor(baseID: string, id: string | null, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.idTo = idTo; // idTo is child
		this.idFrom = idFrom; // idFrom is parent
		this.idPredicate = idPredicate;
		this.dbType = dbDispatch.db.dbType;
		this.order = order;
	}

	get toThing(): Thing | null { return this.thing(true); }
	get fromThing(): Thing | null { return this.thing(false); }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
	get description(): string { return ' \"' + this.baseID + '\" ' + this.isRemotelyStored + ' ' + this.order + ' ' + this.id + ' '	+ k.hierarchy.thing_getForHID(this.idFrom.hash())?.description + ' => ' + k.hierarchy.thing_getForHID(this.idTo.hash())?.description; }

	get isValid(): boolean {
		if (this.idPredicate && this.idFrom && this.idTo) {
			return true;
		}
		return false;
	}

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	thing(to: boolean): Thing | null {
		const id = to ? this.idTo : this.idFrom;
		return k.hierarchy?.thing_getForHID(id.hash()) ?? null
	}

	async order_setTo(newOrder: number, remoteWrite: boolean = false) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			this.order = newOrder;
			if (remoteWrite) {
				await this.remoteWrite();
			}
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