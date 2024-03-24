import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { dbDispatch } from '../common/GlobalImports';

export default class Predicate extends RemoteIdentifiable {
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true) {
		super(id, isRemotelyStored);
		this.kind = kind;
	}

	static get idContains(): string {
		const id = dbDispatch.db.hierarchy.predicate_byKind['contains']?.id;
		if (!id) {
			console.log(`contains is missing`)
		}
		return id;
	}
	
	static get predicate_contains(): Predicate {
		return dbDispatch.db.hierarchy.predicate_byHID[Predicate.idContains.hash()];
	}
}