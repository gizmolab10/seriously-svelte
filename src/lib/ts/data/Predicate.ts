import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { g, Path } from '../common/GlobalImports';

export default class Predicate extends RemoteIdentifiable {
	directions: number;
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		super(id, isRemotelyStored);
		this.directions = directions;
		this.kind = kind;
	}

	angle_necklace(pointsTo: boolean): number {
		const delta = Math.PI * 0.36;
		switch (this.id) {
			case Predicate.idIsRelated: return -delta;
			case Predicate.idContains: return pointsTo ? 0 : delta * 2.3;
		}
		return 0;
	}

	isInPath(path: Path): boolean {
		let found = false;
		const relationships = g.hierarchy.relationships_get_forPredicateHID(this.id.hash());
		if (!!relationships) {
			for (const hid of path.hashedIDs) {
				if (g.hierarchy.relationship_get_forHID(hid)) {
					found = true;
				}
			}
		}
		return found;
	}

	static get idContains(): string {
		const id = g.hierarchy.predicate_get_forKind('contains')?.id;
		if (!id) {
			console.log(`contains is missing`)
		}
		return id!;
	}

	static get idIsRelated(): string {
		const id = g.hierarchy.predicate_get_forKind('isRelated')?.id;
		if (!id) {
			console.log(`isRelated is missing`)
		}
		return id!;
	}
}