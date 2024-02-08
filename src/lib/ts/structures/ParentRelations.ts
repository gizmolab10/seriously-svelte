
import { Path, Thing } from '../common/GlobalImports';

export default class ParentRelations {
	parentPaths_byPredicateHID: { [hID: number]: Array<Path> } = {};
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }
	parentsFor(predicateHID: number): Array<Thing> { return this.parentPathsFor(predicateHID).map(p => p.thing!); }
	parentPathsFor(predicateHID: number): Array<Path> { return this.parentPaths_byPredicateHID[predicateHID] ?? []; }
	parentPaths_setFor(predicateHID: number, paths: Array<Path>) { return this.parentPaths_byPredicateHID[predicateHID] = paths; }

	assemble_from(path: Path) {			// path to thing
		const parentPath = path.fromPath;
		const predicateHID = path.predicateID.hash();
		let paths_from = this.parentPathsFor(predicateHID);
		if (!parentPath.includedInPaths(paths_from)) {
			paths_from.push(parentPath);
			this.parentPaths_setFor(predicateHID, paths_from);
		}
	}

}
