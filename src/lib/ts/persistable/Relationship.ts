import { h, Thing, T_Order, databases, Predicate } from '../common/Global_Imports';
import { T_Persistable, T_Predicate } from '../common/Global_Imports';
import { w_relationship_order } from '../common/Stores';
import Identifiable from '../runtime/Identifiable';
import type { Integer } from '../common/Types';
import Persistable from './Persistable';
import Airtable from 'airtable';

export default class Relationship extends Persistable {
	isReversed = false;
	hidParent: Integer;
	hidChild: Integer;
	kind: T_Predicate;
	idParent: string;
	idChild: string;
	orders = [0, 0];
	order = 0;

	constructor(idBase: string, id: string, kind: T_Predicate, idParent: string, idChild: string, order = 0, parentOrder: number = 0, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.relationships, id, already_persisted);
		this.orders = [order, parentOrder];
		this.hidParent = idParent.hash();
		this.hidChild = idChild.hash();
		this.idParent = idParent;
		this.idChild = idChild;
		this.order = order;				// temporary backwards compatibility
		this.kind = kind;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get isValid(): boolean { return !!this.kind && !!this.parent && !!this.child; }
	get predicate(): Predicate | null { return h.predicate_forKind(this.kind); }
	get fields(): Airtable.FieldSet { return { kind: this.kind, parent: [this.idParent], child: [this.idChild], order: this.order }; }
	get reversed(): Relationship | null { return h?.relationship_forPredicateKind_parent_child(this.kind, this.idChild.hash(), this.idParent.hash()) ?? null; }
	
	get verbose(): string {
		const persisted = this.persistence.already_persisted ? 'STORED' : 'DIRTY';
		return `BASE ${this.idBase} ${persisted} [${this.orders}] ${this.id} ${this.description}`;
	}

	get description(): string {
		const child = this.child ? this.child.description : this.idChild;
		const parent = this.parent ? this.parent.description : this.idParent;
		return `${parent} ${this.predicate?.kind} ${child}`;
	}

	get reversed_remember_createUnique(): Relationship {
		let reversed = this.reversed;
		if (!reversed) {
			reversed = new Relationship(this.idBase, Identifiable.id_inReverseOrder(this.id), this.kind, this.idChild, this.idParent, this.orders[1], this.orders[0]);
			reversed.isReversed = true;
			h.relationship_remember(reversed);
		}
		return reversed;
	}

	order_forPointsTo(pointsToChildren: boolean): number {
		return pointsToChildren ? this.orders[T_Order.child] : this.orders[T_Order.other];
	}

	remove_from(relationships: Array<Relationship>) {
		relationships.filter(t => t.kind != this.kind)
	}

	orders_setTo(newOrders: Array<number>, persist: boolean = false) {
		this.order_setTo(newOrders[T_Order.child]);	// don't persist or signal, yet
		this.order_setTo(newOrders[T_Order.other], T_Order.other, persist);
	}

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return h.thing_forHID(id.hash()) ?? null
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.relationship_persistentUpdate(this);
		} else {
			await databases.db_now.relationship_remember_persistentCreate(this);
		}
	}

	order_setTo_forPointsTo(order: number, toChildren: boolean = true, persist: boolean = false) {
		const t_order = toChildren ? T_Order.child : T_Order.other;
		this.order_setTo(order, t_order, persist);
	}

	order_setTo(newOrder: number, t_order: T_Order = T_Order.child, persist: boolean = false) {
		const order = this.orders[t_order];
		if (Math.abs(order - newOrder) > 0.001) {
			this.orders[t_order] = newOrder;
			w_relationship_order.set(Date.now());
			if (persist) {
				this.set_isDirty();
			}
		}
	}

	assign_idParent(idParent: string) {
		h.relationship_forget(this);
		this.idParent = idParent;
		this.hidParent = idParent.hash();
		this.set_isDirty();
		h.relationship_remember(this);
	}

}