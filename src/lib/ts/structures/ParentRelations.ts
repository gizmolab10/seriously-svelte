
import { Path, Thing } from '../common/GlobalImports';

export default class ParentRelations {
	parentPaths_byPredicateHID: { [hID: number]: Array<Path> } = {};
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }
	parentsFor(predicateHID: number): Array<Thing> { return this.parentPathsFor(predicateHID).map(p => p.thing()!); }
	parentPaths_setFor(predicateHID: number, paths: Array<Path>) { return this.parentPaths_byPredicateHID[predicateHID] = paths; }
	parentPathsFor(predicateHID: number) : Array<Path> { return this.parentPaths_byPredicateHID[predicateHID] ?? []; }

	assemble_from(path: Path) {			// path to thing
		const parentPath = path.parentPath;
		const predicateHID = path.predicateID.hash();
		let paths_from = this.parentPathsFor(predicateHID);
		if (!parentPath.includedInPaths(paths_from)) {
			if (this.thing.title == 'h') {
				console.log(`ADD PATH ${parentPath.thingTitles} TO \"${this.thing.title}\"`);
			}
			paths_from.push(parentPath);
			this.parentPaths_setFor(predicateHID, paths_from);
		}
	}

}
