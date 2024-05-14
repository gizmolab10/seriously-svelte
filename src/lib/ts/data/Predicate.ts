import { u, get, Angle, dbDispatch, PredicateKind } from '../common/GlobalImports';
import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { s_cluster_angle } from '../state/State';
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

	angle_ofLine_for(points_out: boolean): number {
		const tweak = Math.PI * 1 / 4;
		const angle = get(s_cluster_angle);
		
		return u.normalized_angle(this.isBidirectional ? angle + Angle.half + tweak : points_out ? angle : angle + Angle.half - tweak);
	}

}