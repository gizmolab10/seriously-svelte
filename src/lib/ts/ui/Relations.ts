
import { Path, Thing, Predicate, dbDispatch } from '../common/GlobalImports';

export class Paths {
	predicate: Predicate;
	toPaths: Array<Path> = [];
	fromPaths: Array<Path> = [];

	constructor(predicate: Predicate) { this.predicate = predicate; }

	paths_recursive_assemble(path: Path, thingID: string, visited: Array<number> = []) {
		const hierarchy = dbDispatch.db.hierarchy;
		const relationships = hierarchy.relationships_getByPredicateIDToAndID(this.predicate.id, false, thingID);
		this.fromPaths.push(path.parentPath);
		for (const relationship of relationships) {						// loop through all child relationships
			for (const fromPath of this.fromPaths) {
				const childPath = fromPath.appendID(relationship.id);	// add each relationship's id
				this.toPaths.push(childPath);							// and push onto the toPaths
				const child = hierarchy.thing_getForPath(childPath);	// recurse with each child thing
				child?.relations.relations_recursive_assemble(childPath, visited);
			}
		}
	}
}

export class Relations {
	knownPaths_byPredicateHID: { [hID: number]: Paths } = {};
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }

	thingsFor(predicateHID: number, to: boolean): Array<Thing> {
		return this.pathsFor(predicateHID, to).map(p => p.thing()!);
	}

	pathsFor(predicateHID: number, to: boolean): Array<Path> {
		const paths = this.knownPaths_byPredicateHID[predicateHID];
		if (paths) {
			return to ? paths.toPaths : paths.fromPaths;
		}
		return [];
	}

	relations_recursive_assemble(path: Path, visited: Array<number> = []) {
		const thingHID = this.thing.hashedID;
		if (!visited.includes(thingHID)) {
			for (const predicate of dbDispatch.db.hierarchy?.knownPs ?? []) {
				const paths = new Paths(predicate);
				paths.paths_recursive_assemble(path, this.thing.id, [...visited, thingHID]);
				this.knownPaths_byPredicateHID[predicate.hashedID] = paths;
			}
		}
	}

}
