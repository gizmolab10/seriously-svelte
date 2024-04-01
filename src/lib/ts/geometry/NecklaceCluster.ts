import { Predicate } from '../common/GlobalImports';


export default class NecklaceCluster {
	predicate: Predicate;
	parental: boolean

	constructor(predicate: Predicate, parental: boolean) {
		this.predicate = predicate;
		this.parental = parental;
	}

	get necklace_angle(): number { return this.predicate.necklace_angle(this.parental); }
}