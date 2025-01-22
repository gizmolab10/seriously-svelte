import { Thing, debug, T_Debug, databases, Predicate, T_Predicate } from '../../common/Global_Imports';
import { s_hierarchy } from '../../state/S_Stores';
import type { Integer } from '../../common/Types';
import { T_Datum } from '../dbs/DBCommon';
import { get } from 'svelte/store';
import Datum from '../basis/Datum';
import Airtable from 'airtable';

export default class Relationship extends Datum {
	kindPredicate: T_Predicate;
	hidParent: Integer;
	hidChild: Integer;
	idParent: string;
	idChild: string;
	order: number; 

	constructor(idBase: string, id: string, kindPredicate: T_Predicate, idParent: string, idChild: string, order = 0, already_persisted: boolean = false) {
		super(databases.db.type_db, idBase, T_Datum.relationships, id, already_persisted);
		this.kindPredicate = kindPredicate;
		this.hidParent = idParent.hash();
		this.hidChild = idChild.hash();
		this.idParent = idParent;
		this.idChild = idChild;
		this.order = order;
	}

	get child(): Thing | null { return this.thing(true); }
	get parent(): Thing | null { return this.thing(false); }
	get isValid(): boolean { return !!this.kindPredicate && !!this.parent && !!this.child; }
	get predicate(): Predicate | null { return get(s_hierarchy).predicate_forKind(this.kindPredicate); }
	get fields(): Airtable.FieldSet { return { kindPredicate: this.kindPredicate, parent: [this.idParent], child: [this.idChild], order: this.order }; }

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
		return get(s_hierarchy).thing_forHID(id.hash()) ?? null
	}

	order_setTo_persistentMaybe(newOrder: number, persist: boolean = false) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			this.order = newOrder;
			if (persist) {
				this.set_isDirty();
			}
		}
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db.relationship_persistentUpdate(this);
		} else if (databases.db.isPersistent) {
			await databases.db.relationship_remember_persistentCreate(this);
		}
	}

}