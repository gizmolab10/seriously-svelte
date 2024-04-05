import { Predicate } from '../common/GlobalImports';

export default class ClusterLayout {
	predicate: Predicate;
	pointsTo: boolean

	constructor(predicate: Predicate, pointsTo: boolean) {
		this.predicate = predicate;
		this.pointsTo = pointsTo;
	}

	get title(): string {
		if (!this.pointsTo && this.predicate.id == Predicate.idContains) {
			return 'is contained by';
		}
		return this.predicate.kind.unCamelCase().lastWord()
	}

	get angle(): number { return this.predicate.clusterAngle(this.pointsTo); }
}