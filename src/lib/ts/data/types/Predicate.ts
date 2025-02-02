import { k, debug, T_Debug, databases, T_Predicate } from '../../common/Global_Imports';
import Persistent_Identifiable from '../basis/Persistent_Identifiable';
import { w_hierarchy } from '../../state/S_Stores';
import { T_Datum } from '../dbs/DBCommon';
import { get } from 'svelte/store';

export default class Predicate extends Persistent_Identifiable {
	isBidirectional: boolean;
	kind: T_Predicate;

	constructor(id: string, kind: T_Predicate, isBidirectional: boolean, already_persisted: boolean = false) {
		super(databases.db.t_database, T_Datum.predicates, id, already_persisted);
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
	static predicate_forKind(kind: string): Predicate | null { return get(w_hierarchy).predicate_forKind(kind) ?? null; }

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db.predicate_persistentUpdate(this);
		} else if (databases.db.isPersistent) {
			await databases.db.predicate_remember_persistentCreate(this);
		}
	}

}