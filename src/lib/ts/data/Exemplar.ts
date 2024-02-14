import { k, Path, Thing, dbDispatch } from '../common/GlobalImports'

class Exemplar extends Thing {
	path: Path;

	constructor() {
		super(dbDispatch.db.baseID, 'exemplar', 'this item is selected', '#b52', '?', 0, true);
		this.path = k.hierarchy.path_remember_unique('exemplar');
		this.isExemplar = true;
	}

}

export const exemplar = new Exemplar();