import { k, debug, DebugFlag, dbDispatch, PredicateKind } from '../common/Global_Imports';
import PersistentIdentifiable from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../../ts/state/Svelte_Stores';
import { get } from 'svelte/store';

export default class Predicate extends PersistentIdentifiable {
	isBidirectional: boolean;
	stateIndex: number;
	kind: string;

	constructor(id: string, kind: string, isBidirectional: boolean, already_persisted: boolean = false) {
		super(dbDispatch.db.dbType, id, already_persisted);
		this.stateIndex		 = Predicate.stateIndex_forKind(kind);		// index in page states inward and outward arrays
		this.isBidirectional = isBidirectional;
		this.kind			 = kind;
	}
	
	static nextIndex = 5;
	get description():					  			  string { return this.kind.unCamelCase().lastWord(); }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }
	static get contains():				    Predicate | null { return this.predicate_forKind(PredicateKind.contains); }
	static get explains():				    Predicate | null { return this.predicate_forKind(PredicateKind.explains); }
	static get requires():				    Predicate | null { return this.predicate_forKind(PredicateKind.requires); }
	static get supports():				    Predicate | null { return this.predicate_forKind(PredicateKind.supports); }
	static get isRelated():				    Predicate | null { return this.predicate_forKind(PredicateKind.isRelated); }
	static get appreciates():			  	Predicate | null { return this.predicate_forKind(PredicateKind.appreciates); }
	static predicate_forKind(kind: string): Predicate | null { return get(s_hierarchy).predicate_forKind(kind) ?? null; }

    static predicate_fromJSON(json: string): Predicate {
        const parsed = JSON.parse(json);
        return new Predicate(parsed.id, parsed.kind, parsed.isBidirectional, true);
    }

	static stateIndex_forKind(kind: string): number {
		switch (kind) {
			case PredicateKind.contains: return 0;
			case PredicateKind.isRelated: return 1;
			case PredicateKind.explains: return 2;
			case PredicateKind.requires: return 3;
			case PredicateKind.supports: return 4;
			case PredicateKind.appreciates: return 5;
		}
		return this.nextIndex += 1;
	}

	async persist() {
		if (!this.awaitingCreation) {
			this.updateModifyDate();
			if (this.already_persisted) {
				await dbDispatch.db.predicate_persistentUpdate(this);
			} else if (dbDispatch.db.isPersistent) {
				await dbDispatch.db.predicate_remember_persistentCreate(this);
			}
		}
	}

}