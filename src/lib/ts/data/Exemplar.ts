import { Thing, dbDispatch } from '../common/GlobalImports'

class Exemplar extends Thing {

	constructor() {
		super(dbDispatch.bulkID, null, 'this item is selected', '#b52', '?', 0, true);
		this.isExemplar = true;
	}

	get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();