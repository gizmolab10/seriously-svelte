import { k, debug, T_Debug, databases, T_Predicate } from '../../common/Global_Imports';
import Persistent_Identifiable from '../basis/Persistent_Identifiable';
import { s_hierarchy } from '../../state/S_Stores';
import { T_Datum } from '../dbs/DBCommon';
import { get } from 'svelte/store';

export default class Predicate extends Persistent_Identifiable {
	isBidirectional: boolean;
	stateIndex: number;
	kind: T_Predicate;

	constructor(id: string, kind: T_Predicate, isBidirectional: boolean, already_persisted: boolean = false) {
		super(databases.db.type_db, T_Datum.predicates, id, already_persisted);
		this.stateIndex		 = Predicate.stateIndex_forKind(kind);		// index in page states inward and outward arrays
		this.isBidirectional = isBidirectional;
		this.kind			 = kind;
	}
	
	static nextIndex = 5;
	get description():					  			  string { return this.kind.unCamelCase().lastWord(); }
	log(option: T_Debug, message: string) { debug.log_maybe(option, message + k.space + this.description); }
	static get contains():				    Predicate | null { return this.predicate_forKind(T_Predicate.contains); }
	static get explains():				    Predicate | null { return this.predicate_forKind(T_Predicate.explains); }
	static get requires():				    Predicate | null { return this.predicate_forKind(T_Predicate.requires); }
	static get supports():				    Predicate | null { return this.predicate_forKind(T_Predicate.supports); }
	static get isRelated():				    Predicate | null { return this.predicate_forKind(T_Predicate.isRelated); }
	static get appreciates():			  	Predicate | null { return this.predicate_forKind(T_Predicate.appreciates); }
	static predicate_forKind(kind: string): Predicate | null { return get(s_hierarchy).predicate_forKind(kind) ?? null; }

	static stateIndex_forKind(kind: string): number {
		switch (kind) {
			case T_Predicate.contains: return 0;
			case T_Predicate.isRelated: return 1;
			case T_Predicate.explains: return 2;
			case T_Predicate.requires: return 3;
			case T_Predicate.supports: return 4;
			case T_Predicate.appreciates: return 5;
		}
		return this.nextIndex += 1;
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db.predicate_persistentUpdate(this);
		} else if (databases.db.isPersistent) {
			await databases.db.predicate_remember_persistentCreate(this);
		}
	}

}