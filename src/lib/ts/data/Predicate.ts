import { dbDispatch } from '../common/GlobalImports';

export default class Predicate {
	id: string;
	kind: string;

	constructor(id: string, kind: string) {
		this.id = id;
		this.kind = kind;
	}

	static get idIsAParentOf(): string { return dbDispatch.db.hierarchy.knownP_byKind['isAParentOf']?.id ?? 'alert: isAParentOf is unrecognized'; }

}