import { Predicate, Alteration } from '../common/GlobalImports';

export default class AlterationState {
	alteration: Alteration;
	predicate: Predicate | null;

	constructor(alteration: Alteration, predicate: Predicate | null) {
		this.predicate = predicate ?? Predicate.contains;
		this.alteration = alteration;
	}

	get description(): string { return `${this.alteration} ${this.predicate?.description ?? 'unpredicated'}`; }
}