import { dbDispatch, PredicateKind } from '../common/Global_Imports';
import PersistentIdentifiable from '../basis/PersistentIdentifiable';
import { s_hierarchy } from '../../ts/state/Svelte_Stores';
import { get } from 'svelte/store';

export default class Predicate extends PersistentIdentifiable {
	isBidirectional: boolean;
	stateIndex: number;
	kind: string;

	constructor(id: string, kind: string, isBidirectional: boolean, already_saved: boolean = false) {
		super(dbDispatch.db.dbType, id, already_saved);
		this.isBidirectional = isBidirectional;
		this.stateIndex = Predicate.nextIndex;		// index in page states inward and outward arrays
		Predicate.nextIndex += 1;
		this.kind = kind;
	}

	static predicate_forKind(kind: string) { return get(s_hierarchy).predicate_forKind(kind) ?? null; }
	static id_forKind(kind: string) { return this.predicate_forKind(kind)?.id ?? `${kind} is missing`; }
	static get isRelated(): Predicate | null { return this.predicate_forKind(PredicateKind.isRelated); }
	static get contains(): Predicate | null { return this.predicate_forKind(PredicateKind.contains); }
	static get idIsRelated(): string { return this.id_forKind(PredicateKind.isRelated); }
	static get idContains(): string { return this.id_forKind(PredicateKind.contains); }
	get description(): string { return this.kind.unCamelCase().lastWord(); }
	static nextIndex = 0;

    static predicate_fromJSON(json: string): Predicate {
        const parsed = JSON.parse(json);
        return new Predicate(parsed.id, parsed.kind, parsed.isBidirectional, true);
    }

}