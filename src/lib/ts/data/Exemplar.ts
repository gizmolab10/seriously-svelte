import { Path, paths, Thing, dbDispatch } from '../common/GlobalImports'

class Exemplar extends Thing {
	path: Path;

	constructor() {
		super(dbDispatch.db.baseID, 'exemplar', 'this item is selected', '#b52', '?', 0, true);
		this.path = paths.uniquePath('exemplar');
		this.isExemplar = true;
	}

	get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();