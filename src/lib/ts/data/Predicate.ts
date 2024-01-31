import { dbDispatch } from '../common/GlobalImports';
import Identifiable from '../common/Identifiable';

export default class Predicate extends Identifiable {
	kind: string;

	constructor(id: string, kind: string) {
		super(id);
		this.kind = kind;
	}

	static get idIsAParentOf(): string { return dbDispatch.db.hierarchy.knownP_byKind['isAParentOf']?.id ?? 'alert: isAParentOf is unrecognized'; }
	static get predicate_isAParentOf(): Predicate { return dbDispatch.db.hierarchy.knownP_byHID[Predicate.idIsAParentOf.hash()]; }
}