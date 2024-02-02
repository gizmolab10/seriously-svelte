
import { Path, Thing, Predicate, dbDispatch } from '../common/GlobalImports';

export class PredicatedPaths {
	predicateID: string;
	toPaths: Array<Path> = [];
	fromPaths: Array<Path> = [];

	constructor(predicateID: string) { this.predicateID = predicateID; }

	path_from_addUnique(path: Path, thing: Thing) {
		if (!path.includedInPaths(this.fromPaths)) {
			// if (thing.title == 'b') {
			// 	console.log(`${thing.title} FROM ${path.thingTitles}`);
			// }
			this.fromPaths.push(path);
		}
	}

	path_to_add(relationshipID: string, thing: Thing) {
		const hierarchy = dbDispatch.db.hierarchy;
		const toRelationships = hierarchy.relationships_getByPredicateIDToAndID(this.predicateID, false, thing.id);
		for (const toRelationship of toRelationships) {						// loop through all child relationships
			for (const fromPath of this.fromPaths) {
				const childPath = fromPath.appendID(relationshipID).appendID(toRelationship.id);		// add each toRelationship's id
				if (!childPath.includedInPaths(this.toPaths)) {
					if (thing.title == 'b') {
						console.log(`${thing.title} TO ${childPath.thingTitles}`);
					}
					this.toPaths.push(childPath);								// and push onto the toPaths
					const child = hierarchy.thing_getForPath(childPath);
					child?.relations.relations_recursive_assemble(childPath);	// recurse with each child path
				}
			}
		}
	}
	
	predicated_recursive_assemble(path: Path, thing: Thing) {
		this.path_from_addUnique(path.parentPath, thing);
		this.path_to_add(path.endID, thing);
	}
}

export class Relations {
	known_byPredicateHID: { [hID: number]: PredicatedPaths } = {};
	thing: Thing;

	constructor(thing: Thing) { this.thing = thing; }

	thingsFor(predicateHID: number, to: boolean): Array<Thing> {
		return this.pathsFor(predicateHID, to).map(p => p.thing()!);
	}

	predicatedPaths_uniqueFor(predicateID: string) {
		const predicateHID = predicateID.hash();
		return this.known_byPredicateHID[predicateHID] ?? new PredicatedPaths(predicateID);
	}

	pathsFor(predicateHID: number, to: boolean): Array<Path> {
		const predicated = this.known_byPredicateHID[predicateHID];
		if (predicated) {
			return to ? predicated.toPaths : predicated.fromPaths;
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
	
	path_remember(path: Path, to: boolean) {
		const relationship = path.relationship();
		if (relationship) {
			const predicateID = relationship.idPredicate;
			const predicated = this.predicatedPaths_uniqueFor(predicateID);
			const paths = this.pathsFor(predicateID.hash(), to);
			paths.push(path);
			if (to) {
				predicated.toPaths = paths;
			} else {
				predicated.fromPaths = paths;
			}
		}
	}

}
