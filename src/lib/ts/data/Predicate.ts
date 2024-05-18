import { dbDispatch, PredicateKind } from '../common/GlobalImports';
import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { h } from '../../ts/db/DBDispatch';

export default class Predicate extends RemoteIdentifiable {
	isBidirectional: boolean;
	kind: string;

	constructor(id: string, kind: string, isBidirectional: boolean, isRemotelyStored: boolean = true) {
		super(dbDispatch.db.dbType, id, isRemotelyStored);
		this.isBidirectional = isBidirectional;
		this.kind = kind;
	}

	static predicate_forKind(kind: string) { return h?.predicate_forKind(kind) ?? null; }
	static id_forKind(kind: string) { return this.predicate_forKind(kind)?.id ?? `${kind} is missing`; }
	static get isRelated(): Predicate | null { return this.predicate_forKind(PredicateKind.isRelated); }
	static get contains(): Predicate | null { return this.predicate_forKind(PredicateKind.contains); }
	static get idIsRelated(): string { return this.id_forKind(PredicateKind.isRelated); }
	static get idContains(): string { return this.id_forKind(PredicateKind.contains); }
	get description(): string { return this.kind; }

}