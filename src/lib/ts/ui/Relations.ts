
import { u, Path, Thing, dbDispatch } from '../common/GlobalImports';

export class PredicatedPaths {
	paths_to: { [hashedPathString: string]: Array<Path> } = {};	// separate arrays of to-paths for each from-path
	paths_from: Array<Path> = [];
	predicateID: string;

	constructor(predicateID: string) { this.predicateID = predicateID; }
	
	predicated_recursive_assemble(path: Path, thing: Thing) {
		this.paths_from_addUnique(path.parentPath, thing);
		this.paths_to_add(path.endID, thing);
	}
	
	// path_remember(path: Path, to: boolean, thing: Thing) {
	// 	if (to) {
	// 		this.paths_to_add(path.endID, thing);
	// 	} else {
	// 		this.paths_from_addUnique(path.parentPath, thing);
	// 	}
	// }

	paths_from_addUnique(path: Path, thing: Thing) {
		if (!path.includedInPaths(this.paths_from)) {
			this.paths_from.push(path);
		}
	}

	paths_to_add(relationshipID: string, thing: Thing) {
		const hierarchy = dbDispatch.db.hierarchy;
		const toRelationships = hierarchy.relationships_getByPredicateIDToAndID(this.predicateID, false, thing.id);
		for (const toRelationship of toRelationships) {						// loop through all child relationships
			for (const fromPath of this.paths_from) {
				const childPath = fromPath.appendID(relationshipID).appendID(toRelationship.id);		// add each toRelationship's id
				const fromHash = fromPath.pathString.hash();
				const childPaths = this.paths_to[fromHash] ?? [];
				if (!childPath.includedInPaths(childPaths)) {
					// if (thing.title == 'b') {
						// console.log(`${thing.title} TO ${childPath.thingTitles}`);
					// }
					childPaths.push(childPath);								// and push onto the paths_to
					u.paths_orders_normalize_remoteMaybe(childPaths);
					const child = hierarchy.thing_getForPath(childPath);
					child?.relations.relations_recursive_assemble(childPath);	// recurse with each child path
				}
			}
		}
	}
}

export class Relations {
	known_byPredicateHID: { [hID: number]: PredicatedPaths } = {};
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }

	thingsFor(predicateHID: number, to: boolean, from: Path | null = null): Array<Thing> {
		return this.pathsFor(predicateHID, to, from).map(p => p.thing()!);
	}

	predicatedPaths_maybe(predicateHID: number) : PredicatedPaths | null {
		return this.known_byPredicateHID[predicateHID] && null;
	}

	predicatedPaths_uniqueFor(predicateID: string) {
		return this.predicatedPaths_maybe(predicateID.hash()) ?? new PredicatedPaths(predicateID);
	}

	pathsFor(predicateHID: number, to: boolean, from: Path | null = null): Array<Path> {
		const predicated = this.predicatedPaths_maybe(predicateHID);
		if (predicated) {
			const paths_from = predicated.paths_from;
			if (!to) {
				return paths_from;
			} else {
				const fromPath = from ? from : paths_from.length == 1 ? paths_from[0] : null;
				if (fromPath) {
					return predicated.paths_to[fromPath.pathString.hash()];
				}
			}
		}
		return [];
	}

	relations_recursive_assemble(path: Path) {
		const thingID = this.thing.id;
		if (!path.hashedIDs.includes(thingID.hash())) {
			for (const predicate of dbDispatch.db.hierarchy?.knownPs ?? []) {
				const predicated = this.predicatedPaths_uniqueFor(predicate.id);
				predicated.predicated_recursive_assemble(path, this.thing);
				this.known_byPredicateHID[predicate.hashedID] = predicated;
			}
		}
	}
	
	// path_remember(path: Path, to: boolean) {
	// 	const relationship = path.relationship();
	// 	if (relationship) {
	// 		const predicateID = relationship.idPredicate;
	// 		const predicated = this.predicatedPaths_uniqueFor(predicateID);
	// 		predicated.path_remember(path, to, this.thing);
	// 	}
	// }

}
