import { Predicate, T_Alteration } from '../common/Global_Imports';

export default class Alteration_State {
	type: T_Alteration;
	predicate: Predicate | null;

	constructor(type: T_Alteration, predicate: Predicate | null) {
		this.predicate = predicate ?? Predicate.contains;
		this.type = type;
	}

	get description(): string { return `${this.type} ${this.predicate?.description ?? 'unpredicated'}`; }
}