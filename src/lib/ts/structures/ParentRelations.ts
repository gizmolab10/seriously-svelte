
import { Path, Thing, dbDispatch } from '../common/GlobalImports';

export default class ParentRelations {
	parentPaths_byPredicateHID: { [hID: number]: Array<Path> } = {};
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }

	parentsFor(predicateHID: number): Array<Thing> {
		return this.parentPathsFor(predicateHID).map(p => p.thing()!);
	}

	parentPathsFor(predicateHID: number) : Array<Path> {
		return this.parentPaths_byPredicateHID[predicateHID] ?? [];
	}

	parentRelations_assemble(path: Path) {
		const thingID = this.thing.id;
		if (!path.hashedIDs.includes(thingID.hash())) {
			for (const predicate of dbDispatch.db.hierarchy?.knownPs ?? []) {
				const parentPaths = this.parentPathsFor(predicate.hashedID);
				this.parentPaths_byPredicateHID[predicate.hashedID] = parentPaths;
			}
		}
	}

}
