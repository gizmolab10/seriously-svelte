import { Ancestry, Predicate, E_Alteration } from '../common/Global_Imports';

export default class S_Alteration {
	e_alteration: E_Alteration;
	predicate: Predicate | null;
	ancestry!: Ancestry;

	constructor(ancestry: Ancestry, e_alteration: E_Alteration, predicate: Predicate | null) {
		this.predicate = predicate ?? Predicate.contains;
		this.e_alteration = e_alteration;
		this.ancestry = ancestry;
	}

	get description(): string { return `${this.e_alteration} ${this.predicate?.description ?? 'unpredicated'}`; }
}