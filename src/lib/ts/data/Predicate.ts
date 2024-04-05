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

	clusterAngle(pointsTo: boolean): number {
		const delta = Math.PI * 0.36;
		switch (this.id) {
			case Predicate.idIsRelated: return -delta;
			case Predicate.idContains: return pointsTo ? 0 : delta * 2;
		}
		return 0;
	}

	static get idContains(): string {
		const kind = PredicateKind.contains;
		const id = g.hierarchy.predicate_get_forKind(kind)?.id;
		if (!id) {
			console.log(`${kind} is missing`)
		}
		return id!;
	}

	static get idIsRelated(): string {
		const kind = PredicateKind.isRelated;
		const id = g.hierarchy.predicate_get_forKind(kind)?.id;
		if (!id) {
			console.log(`${kind} is missing`)
		}
		return id!;
	}
}