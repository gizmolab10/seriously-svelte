import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { g, u, get, PredicateKind } from '../common/GlobalImports';
import { s_cluster_angle } from '../state/State';

export default class Predicate extends RemoteIdentifiable {
	directions: number;
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		super(id, isRemotelyStored);
		this.directions = directions;
		this.kind = kind;
	}

	static id_forKind(kind: string) { return this.predicate_forKind(kind)?.id ?? `${kind} is missing`; }
	static predicate_forKind(kind: string) { return g.hierarchy?.predicate_forKind(kind) ?? null; }
	static get contains(): Predicate | null { return this.predicate_forKind(Predicate.idContains); }
	static get related(): Predicate | null { return this.predicate_forKind(Predicate.idIsRelated); }
	static get idIsRelated(): string { return this.id_forKind(PredicateKind.isRelated); }
	static get idContains(): string { return this.id_forKind(PredicateKind.contains); }

	clusterAngle_for(pointsTo: boolean): number {
		const angle = get(s_cluster_angle);
		switch (this.id) {
			case Predicate.idContains:	return pointsTo ? angle / 2 : angle * 2.5;
			case Predicate.idIsRelated: return -angle;
			default:					return 0;
		}
	}

}