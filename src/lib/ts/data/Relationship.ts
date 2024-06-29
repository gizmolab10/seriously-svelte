import { k, Thing, debug, DebugFlag, dbDispatch, Predicate } from '../common/Global_Imports';
import { idDefault } from '../data/Identifiable';
import { h } from '../db/DBDispatch';
import Airtable from 'airtable';
import Datum from './Datum';

export default class Relationship extends Datum {
	idPredicate: string;
	idParent: string;
	idChild: string;
	order: number; 

	constructor(baseID: string, id: string = idDefault, idPredicate: string, idParent: string, idChild: string, order = 0, isRemotelyStored: boolean = false) {
		super(dbDispatch.db.dbType, baseID, id, isRemotelyStored);
		this.idPredicate = idPredicate;
		this.idParent = idParent;
		this.idChild = idChild;
		this.order = order;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get predicate(): Predicate | null { return h.predicate_forID(this.idPredicate) }
	get isValid(): boolean { return !!(this.idPredicate && this.idParent && this.idChild); }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], parent: [this.idParent], child: [this.idChild], order: this.order }; }
	get description(): string { return `BASE ${this.baseID} STORED ${this.isRemotelyStored} ORDER ${this.order} ID ${this.id} PARENT ${this.parent?.description} ${this.predicate?.kind} CHILD ${this.child?.description}`; }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return h.thing_forHID(id.hash()) ?? null
	}

	async order_setTo_remoteMaybe(newOrder: number, remoteWrite: boolean = false) {
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
			} else if (dbDispatch.db.isRemote) {
				await dbDispatch.db.relationship_remember_remoteCreate(this);
			}
		}
	}

}