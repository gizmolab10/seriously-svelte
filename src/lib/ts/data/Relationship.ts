import { g, k, Thing, debug, dbDispatch, DebugFlag } from '../common/GlobalImports';
import Airtable from 'airtable';
import Datum from '../structures/Datum';

export default class Relationship extends Datum {
	idPredicate: string;
	dbType: string;
	idFrom: string;
	order: number;
	idTo: string;

	static get nullRelationship(): Relationship { return new Relationship('', null, '', '', '', 0, false); }

	constructor(baseID: string, id: string | null, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.idTo = idTo; // idTo is child
		this.idFrom = idFrom; // idFrom is parent
		this.idPredicate = idPredicate;
		this.dbType = dbDispatch.db.dbType;
		this.order = order;
		// if (baseID != dbDispatch.db.baseID) {
		// 	console.log(`RELATIONSHIP off base ${this.description}`);
		// }
	}

	get toThing(): Thing | null { return this.thing(true); }
	get fromThing(): Thing | null { return this.thing(false); }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }
	get description(): string { return ' \"' + this.baseID + '\" ' + this.isRemotelyStored + k.space + this.order + k.space + this.id + k.space	+ this.fromThing?.description + ' => ' + this.toThing?.description; }

	get isValid(): boolean {
		if (this.idPredicate && this.idFrom && this.idTo) {
			return true;
		}
		return false;
	}

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + k.space + this.description);
	}

	thing(to: boolean): Thing | null {
		const id = to ? this.idTo : this.idFrom;
		return g.hierarchy?.thing_get_byHID(id.hash()) ?? null
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