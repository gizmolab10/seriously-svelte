import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { dbDispatch } from '../common/GlobalImports';

export default class Predicate extends RemoteIdentifiable {
	directions: number;
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true, directions: number = 1) {
		super(id, isRemotelyStored);
		this.directions = directions;
		this.kind = kind;
	}

	static get idContains(): string {
		const id = dbDispatch.db.hierarchy.predicate_byKind['contains']?.id;
		if (!id) {
			console.log(`contains is missing`)
		}
		return id;
	}

	static get idIsRelated(): string {
		const id = dbDispatch.db.hierarchy.predicate_byKind['isRelated']?.id;
		if (!id) {
			console.log(`isRelated is missing`)
		}
		return id;
	}
}