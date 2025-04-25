import { Thing, debug, T_Debug, T_Order, databases, Predicate, T_Predicate } from '../common/Global_Imports';
import { w_hierarchy, w_relationship_order } from '../common/Stores';
import Persistable from '../persistable/Persistable';
import type { Integer } from '../common/Types';
import { T_Persistable } from '../database/DBCommon';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Relationship extends Persistable {
	hidParent: Integer;
	hidChild: Integer;
	kind: T_Predicate;
	idParent: string;
	idChild: string;
	orders = [0, 0];

	constructor(idBase: string, id: string, kind: T_Predicate, idParent: string, idChild: string, order = 0, parentOrder: number = 0, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.relationships, id, already_persisted);
		this.orders = [order, parentOrder];
		this.hidParent = idParent.hash();
		this.hidChild = idChild.hash();
		this.idParent = idParent;
		this.idChild = idChild;
		this.kind = kind;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get isValid(): boolean { return !!this.kind && !!this.parent && !!this.child; }
	get predicate(): Predicate | null { return get(w_hierarchy).predicate_forKind(this.kind); }
	get fields(): Airtable.FieldSet { return { kind: this.kind, parent: [this.idParent], child: [this.idChild], orders: this.orders }; }

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
		return pointsToChildren ? this.orders[T_Order.child] : this.orders[T_Order.other];
	}

	remove_from(relationships: Array<Relationship>) {
		relationships.filter(t => t.kind != this.kind)
	}

	orders_setTo(newOrders: Array<number>, persist: boolean = false) {
		this.order_setTo(newOrders[T_Order.child]);	// don't persist or signal, yet
		this.order_setTo(newOrders[T_Order.other], T_Order.other, persist, true);
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

}