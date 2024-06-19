import { Predicate, AlterationType } from '../common/GlobalImports';

export default class Alteration_State {
	alteration: AlterationType;
	predicate: Predicate | null;

	constructor(alteration: AlterationType, predicate: Predicate | null) {
		this.predicate = predicate ?? Predicate.contains;
		this.alteration = alteration;
	}

	get description(): string { return `${this.alteration} ${this.predicate?.description ?? 'unpredicated'}`; }
}