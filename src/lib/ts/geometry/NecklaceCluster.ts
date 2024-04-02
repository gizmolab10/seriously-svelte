import { Predicate } from '../common/GlobalImports';


export default class NecklaceCluster {
	predicate: Predicate;
	isFrom: boolean

	constructor(predicate: Predicate, isFrom: boolean) {
		this.predicate = predicate;
		this.isFrom = isFrom;
	}

	get necklace_angle(): number { return this.predicate.necklace_angle(this.isFrom); }
}