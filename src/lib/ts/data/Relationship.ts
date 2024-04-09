import { g, k, Thing, debug, dbDispatch, DebugFlag } from '../common/GlobalImports';
import Airtable from 'airtable';
import Datum from '../structures/Datum';

export default class Relationship extends Datum {
	idPredicate: string;
	dbType: string;
	idParent: string;
	order: number;
	idChild: string;

	static get nullRelationship(): Relationship { return new Relationship(k.empty, null, k.empty, k.empty, k.empty, 0, false); }

	constructor(baseID: string, id: string | null, idPredicate: string, idParent: string, idChild: string, order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.idChild = idChild;
		this.idParent = idParent;
		this.idPredicate = idPredicate;
		this.dbType = dbDispatch.db.dbType;
		this.order = order;
	}

	get childThing(): Thing | null { return this.thing(true); }
	get parentThing(): Thing | null { return this.thing(false); }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], parent: [this.idParent], child: [this.idChild], order: this.order }; }
	get description(): string { return ' \"' + this.baseID + '\" ' + this.isRemotelyStored + k.space + this.order + k.space + this.id + k.space	+ this.parentThing?.description + ' => ' + this.childThing?.description; }

	get isValid(): boolean {
		if (this.idPredicate && this.idParent && this.idChild) {
			return true;
		}
		return false;
	}

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + k.space + this.description);
	}

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return g.hierarchy?.thing_get_forHID(id.hash()) ?? null
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