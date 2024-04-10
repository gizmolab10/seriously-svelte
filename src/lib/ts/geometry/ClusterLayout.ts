import { g, k, Predicate } from '../common/GlobalImports';

export default class ClusterLayout {
	idPredicate: string;
	pointsTo: boolean

	constructor(idPredicate: string, pointsTo: boolean) {
		this.idPredicate = idPredicate;
		this.pointsTo = pointsTo;
	}

	get predicate(): Predicate | null { return g.hierarchy.predicate_get_forID(this.idPredicate); }
	get angle(): number { return this.predicate?.clusterAngle(this.pointsTo) ?? 0; }

	get title(): string {
		const reversed = !this.pointsTo && this.predicate?.id == Predicate.idContains;
		return reversed ? 'is contained by' : this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
	}

}