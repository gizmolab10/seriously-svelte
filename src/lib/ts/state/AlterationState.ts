import { Predicate, RelationshipAlteration } from '../common/GlobalImports';

export default class AlterationState {
	alteration: RelationshipAlteration;
	predicate: Predicate | null;

	constructor(alteration: RelationshipAlteration, predicate: Predicate | null = Predicate.contains) {
		this.alteration = alteration;
		this.predicate = predicate;
	}
}