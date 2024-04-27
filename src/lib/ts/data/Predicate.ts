import { get, dbDispatch, PredicateKind } from '../common/GlobalImports';
import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { s_cluster_angle } from '../state/State';
import { h } from '../../ts/db/DBDispatch';

export default class Predicate extends RemoteIdentifiable {
	directions: number;
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		super(dbDispatch.db.dbType, id, isRemotelyStored);
		this.directions = directions;
		this.kind = kind;
	}

	static predicate_forKind(kind: string) { return h?.predicate_forKind(kind) ?? null; }
	static id_forKind(kind: string) { return this.predicate_forKind(kind)?.id ?? `${kind} is missing`; }
	static get isRelated(): Predicate | null { return this.predicate_forKind(PredicateKind.isRelated); }
	static get contains(): Predicate | null { return this.predicate_forKind(PredicateKind.contains); }
	static get idIsRelated(): string { return this.id_forKind(PredicateKind.isRelated); }
	static get idContains(): string { return this.id_forKind(PredicateKind.contains); }
	get description(): string { return this.kind; }

	clusterAngle_for(pointsTo: boolean): number {
		const angle = get(s_cluster_angle);
		switch (this.id) {
			case Predicate.idContains:	return pointsTo ? angle / 2 : angle * 3.3;
			case Predicate.idIsRelated: return -angle;
			default:					return 0;
		}
	}

}