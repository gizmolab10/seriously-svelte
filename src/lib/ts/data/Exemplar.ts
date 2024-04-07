import { g, Path, Thing, dbDispatch } from '../common/GlobalImports'

class Exemplar extends Thing {
	path: Path;

	constructor() {
		super(dbDispatch.db.baseID, 'exemplar', 'this item is selected', '#b52', '?', true);
		const h = g.hierarchy;
		this.path = h.path_remember_createUnique('exemplar')!;
		this.isExemplar = true;
		h.thing_remember(this);
	}

}

export const exemplar = new Exemplar();