import RemoteIdentifiable from "../structures/RemoteIdentifiable";
import { dbDispatch } from '../common/GlobalImports';

export default class Predicate extends RemoteIdentifiable {
	kind: string;

	constructor(id: string, kind: string, isRemotelyStored: boolean = true) {
		super(id, isRemotelyStored);
		this.kind = kind;
	}

	static get idIsAParentOf(): string { return dbDispatch.db.hierarchy.knownP_byKind['isAParentOf']?.id ?? 'programmer error: isAParentOf is unrecognized'; }
	static get predicate_isAParentOf(): Predicate { return dbDispatch.db.hierarchy.knownP_byHID[Predicate.idIsAParentOf.hash()]; }
}