import { k, Thing, debug, DebugFlag, dbDispatch, Predicate } from '../common/GlobalImports';
import { h } from '../../ts/db/DBDispatch';
import Datum from '../structures/Datum';
import Airtable from 'airtable';

export default class Relationship extends Datum {
	idPredicate: string;
	dbType: string;
	idParent: string;
	order: number;
	idChild: string;

	static get nullRelationship(): Relationship { return new Relationship(k.empty, null, k.empty, k.empty, k.empty, 0); }

	constructor(baseID: string, id: string | null, idPredicate: string, idParent: string, idChild: string, order = 0, isRemotelyStored: boolean = false) {
		super(baseID, id, isRemotelyStored);
		this.dbType = dbDispatch.db.dbType;
		this.idPredicate = idPredicate;
		this.idParent = idParent;
		this.idChild = idChild;
		this.order = order;
	}

	get childThing(): Thing | null { return this.thing(true); }
	get parentThing(): Thing | null { return this.thing(false); }
	get isValid(): boolean { return !!(this.idPredicate && this.idParent && this.idChild); }
	get predicate(): Predicate | null { return h.predicate_forID(this.idPredicate) }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idParent], to: [this.idChild], order: this.order }; }
	get description(): string { return `BASE ${this.baseID} STORED ${this.isRemotelyStored} ORDER ${this.order} ID ${this.id} PARENT ${this.parentThing?.description} ${this.predicate?.kind} CHILD ${this.childThing?.description}`; }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return h.thing_forHID(id.hash()) ?? null
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