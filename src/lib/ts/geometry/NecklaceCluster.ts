import { Predicate } from '../common/GlobalImports';


export default class NecklaceCluster {
	predicate: Predicate;

	constructor(predicate: Predicate) {
		this.predicate = predicate;
	}
}