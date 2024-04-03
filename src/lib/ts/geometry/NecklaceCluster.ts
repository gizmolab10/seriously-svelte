import { Predicate } from '../common/GlobalImports';

export default class NecklaceCluster {
	predicate: Predicate;
	pointsTo: boolean

	constructor(predicate: Predicate, pointsTo: boolean) {
		this.predicate = predicate;
		this.pointsTo = pointsTo;
	}

	get angle(): number { return this.predicate.angle_necklace(this.pointsTo); }
}