import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { g, PredicateKind  } from '../common/GlobalImports';

export default class Predicate extends RemoteIdentifiable {
	directions: number;
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		super(id, isRemotelyStored);
		this.directions = directions;
		this.kind = kind;
	}

	static id_forKind(kind: string) { return this.predicate_forKind(kind)?.id ?? `${kind} is missing`; }
	static predicate_forKind(kind: string) { return g.hierarchy.predicate_get_forKind(kind) ?? null; }
	static get contains(): Predicate | null { return this.predicate_forKind(Predicate.idContains); }
	static get related(): Predicate | null { return this.predicate_forKind(Predicate.idIsRelated); }
	static get idIsRelated(): string { return this.id_forKind(PredicateKind.isRelated); }
	static get idContains(): string { return this.id_forKind(PredicateKind.contains); }

	clusterAngle(pointsTo: boolean): number {
		const delta = Math.PI * 0.36;
		switch (this.id) {
			case Predicate.idIsRelated: return -delta;
			case Predicate.idContains: return pointsTo ? 0 : delta * 2;
		}
		return 0;
	}

}