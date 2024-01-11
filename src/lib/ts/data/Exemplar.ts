import { Thing, Datum, dbDispatch, Relationship, Predicate } from '../common/GlobalImports'

class ExemplaryThing extends Thing {

	constructor() {
		super(dbDispatch.db.baseID, null, 'this item is selected', '#b52', '?', 0, true);
		this.isExemplar = true;
	}

	get hasChildren(): boolean { return true; }

}
class Exemplar extends Relationship {

	constructor() {
		const thing = new ExemplaryThing();
		super(dbDispatch.db.baseID, 'exemplar', Predicate.idIsAParentOf, 'exemplar', thing.id, 0, false );
		this.doNotPersist = true;
	}

	get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();