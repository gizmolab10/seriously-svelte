import { Thing, debug, E_Debug, E_Order, databases, Predicate, E_Predicate } from '../common/Global_Imports';
import { w_hierarchy, w_relationship_order } from '../common/Stores';
import Persistable from '../persistable/Persistable';
import type { Integer } from '../common/Types';
import { E_Persistable } from '../database/DBCommon';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Relationship extends Persistable {
	hidParent: Integer;
	hidChild: Integer;
	kind: E_Predicate;
	idParent: string;
	idChild: string;
	orders = [0, 0];
	order = 0;

	constructor(idBase: string, id: string, kind: E_Predicate, idParent: string, idChild: string, order = 0, parentOrder: number = 0, already_persisted: boolean = false) {
		super(databases.db_now.e_database, idBase, E_Persistable.relationships, id, already_persisted);
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
	get predicate(): Predicate | null { return get(w_hierarchy).predicate_forKind(this.kind); }
	get fields(): Airtable.FieldSet { return { kind: this.kind, parent: [this.idParent], child: [this.idChild], order: this.order }; }

	get verbose(): string {
		const persisted = this.persistence.already_persisted ? 'STORED' : 'DIRTY';
		return `BASE ${this.idBase} ${persisted} [${this.orders}] ${this.id} ${this.description}`;
	}

	get description(): string {
		const child = this.child ? this.child.description : this.idChild;
		const parent = this.parent ? this.parent.description : this.idParent;
		return `${parent} ${this.predicate?.kind} ${child}`;
	}

	order_forPointsTo(pointsToChildren: boolean): number {
		return pointsToChildren ? this.orders[E_Order.child] : this.orders[E_Order.other];
	}

	remove_from(relationships: Array<Relationship>) {
		relationships.filter(t => t.kind != this.kind)
	}

	orders_setTo(newOrders: Array<number>, persist: boolean = false) {
		this.order_setTo(newOrders[E_Order.child]);	// don't persist or signal, yet
		this.order_setTo(newOrders[E_Order.other], E_Order.other, persist);
	}

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return get(w_hierarchy).thing_forHID(id.hash()) ?? null
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.relationship_persistentUpdate(this);
		} else {
			await databases.db_now.relationship_remember_persistentCreate(this);
		}
	}

	order_setTo_forPointsTo(order: number, toChildren: boolean = true, persist: boolean = false) {
		const e_order = toChildren ? E_Order.child : E_Order.other;
		this.order_setTo(order, e_order, persist);
	}

	order_setTo(newOrder: number, e_order: E_Order = E_Order.child, persist: boolean = false) {
		const order = this.orders[e_order];
		if (Math.abs(order - newOrder) > 0.001) {
			this.orders[e_order] = newOrder;
			w_relationship_order.set(Date.now());
			if (persist) {
				this.set_isDirty();
			}
		}
	}

}