
import { Path, Thing, Predicate } from '../common/GlobalImports';

export class Paths {
	predicate: Predicate;
	toPaths: Array<Path> = [];
	fromPaths: Array<Path> = [];

	constructor() {
		this.predicate = Predicate.predicate_isAParentOf;
	}

	assembleListFor(thingHID: string) {
		// create all the from- and to- paths
		// according to the predicate
	}
}

export class Relations {
	thing: Thing;

	constructor(thing: Thing) {
		this.thing = thing;
	}

	knownPaths_byPredicateHID: { [hID: number]: Paths } = {};
	assembleRelations() {
		// for each predicate in the hierarchy...
	}
}
