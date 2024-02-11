import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { dbDispatch } from '../common/GlobalImports';

export default class Predicate extends RemoteIdentifiable {
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true) {
		super(id, isRemotelyStored);
		this.kind = kind;
	}

	static get idIsAParentOf(): string {
		const id = dbDispatch.db.hierarchy.knownP_byKind['isAParentOf']?.id;
		if (!id) {
			alert(`BAD PREDICATE`)
		}
		return id;
	}
	
	static get predicate_isAParentOf(): Predicate {
		return dbDispatch.db.hierarchy.knownP_byHID[Predicate.idIsAParentOf.hash()];
	}
}