import { Predicate, Alteration } from '../common/GlobalImports';

export default class AlterationState {
	alteration: Alteration;
	predicate: Predicate | null;

	constructor(alteration: Alteration, predicate: Predicate | null = Predicate.contains) {
		this.alteration = alteration;
		this.predicate = predicate;
	}
}