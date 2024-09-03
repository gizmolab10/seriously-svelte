import { Predicate, AlterationType } from '../common/Global_Imports';

export default class Alteration_State {
	type: AlterationType;
	predicate: Predicate | null;

	constructor(type: AlterationType, predicate: Predicate | null) {
		this.predicate = predicate ?? Predicate.contains;
		this.type = type;
	}

	get description(): string { return `${this.type} ${this.predicate?.description ?? 'unpredicated'}`; }
}