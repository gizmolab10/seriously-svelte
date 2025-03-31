import { Thing, debug, T_Debug, databases, Predicate, T_Predicate } from '../../common/Global_Imports';
import { w_hierarchy } from '../../common/Stores';
import Persistable from '../persistable/Persistable';
import type { Integer } from '../../common/Types';
import { T_Persistable } from '../dbs/DBCommon';
import { get } from 'svelte/store';
import Airtable from 'airtable';

export default class Relationship extends Persistable {
	kind: T_Predicate;
	hidParent: Integer;
	hidChild: Integer;
	idParent: string;
	idChild: string;
	order: number; 

	constructor(idBase: string, id: string, kind: T_Predicate, idParent: string, idChild: string, order = 0, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.relationships, id, already_persisted);
		this.kind = kind;
		this.hidParent = idParent.hash();
		this.hidChild = idChild.hash();
		this.idParent = idParent;
		this.idChild = idChild;
		this.order = order;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get isValid(): boolean { return !!this.kind && !!this.parent && !!this.child; }
	get predicate(): Predicate | null { return get(w_hierarchy).predicate_forKind(this.kind); }
	get fields(): Airtable.FieldSet { return { kind: this.kind, parent: [this.idParent], child: [this.idChild], order: this.order }; }

	get verbose(): string {
		const persisted = this.persistence.already_persisted ? 'STORED' : 'DIRTY';
		return `BASE ${this.idBase} ${persisted} [${this.order}] ${this.id} ${this.description}`;
	}

	get description(): string {
		const child = this.child ? this.child.description : this.idChild;
		const parent = this.parent ? this.parent.description : this.idParent;
		return `${parent} ${this.predicate?.kind} ${child}`;
	}

	log(flag: T_Debug, message: string) { debug.log_maybe(flag, `${message} ${this.description}`); }

	thing(child: boolean): Thing | null {
		const id = child ? this.idChild : this.idParent;
		return get(w_hierarchy).thing_forHID(id.hash()) ?? null
	}

	order_setTo(newOrder: number, persist: boolean = false) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			this.order = newOrder;
			if (persist) {
				this.set_isDirty();
			}
		}
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.relationship_persistentUpdate(this);
		} else {
			await databases.db_now.relationship_remember_persistentCreate(this);
		}
	}

	remove_from(relationships: Array<Relationship>) {
		relationships.filter(t => t.kind != this.kind)
	}

}