import { k, Thing, debug, DebugFlag, dbDispatch, Predicate } from '../common/Global_Imports';
import { s_hierarchy } from '../state/Svelte_Stores';
import { get } from 'svelte/store';
import Datum from '../basis/Datum';
import Airtable from 'airtable';

export default class Relationship extends Datum {
	idPredicate: string;
	idParent: string;
	idChild: string;
	order: number; 

	constructor(baseID: string, id: string, idPredicate: string, idParent: string, idChild: string, order = 0, already_saved: boolean = false) {
		super(dbDispatch.db.dbType, baseID, id, already_saved);
		this.idPredicate = idPredicate;
		this.idParent = idParent;
		this.idChild = idChild;
		this.order = order;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get isValid(): boolean { return !!(this.idPredicate && this.idParent && this.idChild); }
	get predicate(): Predicate | null { return get(s_hierarchy).predicate_forID(this.idPredicate); }
	log(flag: DebugFlag, message: string) { debug.log_maybe(flag, `${message} ${this.description}`); }
	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], parent: [this.idParent], child: [this.idChild], order: this.order }; }
	get description(): string { return `BASE ${this.baseID} STORED ${this.already_saved} ORDER ${this.order} ID ${this.id} PARENT ${this.parent?.description} ${this.predicate?.kind} CHILD ${this.child?.description}`; }

    static relationship_fromJSON(json: string): Relationship {
        const parsed = JSON.parse(json);
        return new Relationship(parsed.baseID, parsed.id, parsed.idPredicate, parsed.idParent, parsed.idChild, parsed.order, true);
    }

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return get(s_hierarchy).thing_forHID(id.hash()) ?? null
	}

	order_setTo_persistentMaybe(newOrder: number, persist: boolean = false) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			this.order = newOrder;
			if (persist) {
				this.needsWrite = true;
			}
		}
	}

	async persist() {
		if (!this.awaitingCreation) {
			this.updateModifyDate();
			if (this.already_saved) {
				await dbDispatch.db.relationship_persistentUpdate(this);
			} else if (dbDispatch.db.isPersistent) {
				await dbDispatch.db.relationship_remember_persistentCreate(this);
			}
		}
	}

}