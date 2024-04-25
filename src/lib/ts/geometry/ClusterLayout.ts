import { k, Predicate } from '../common/GlobalImports';
import { h } from '../db/DBDispatch';

export default class ClusterLayout {
	idPredicate: string;
	pointsTo: boolean;
	count: number;

	constructor(idPredicate: string, count: number, pointsTo: boolean) {
		this.idPredicate = idPredicate;
		this.pointsTo = pointsTo;
		this.count = count;
	}

	get predicate(): Predicate | null { return h.predicate_forID(this.idPredicate); }
	get angle(): number { return this.predicate?.clusterAngle_for(this.pointsTo) ?? 0; }

	get title(): string {
		const reversed = !this.pointsTo && this.predicate?.id == Predicate.idContains;
		const shortened = this.predicate?.kind.unCamelCase().lastWord() ?? k.empty;
		const other = this.pointsTo ? `${shortened} ${this.count}` : `${this.count} ${shortened}`
		return reversed ? `is contained by ${this.count}` : other;
	}

}