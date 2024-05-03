import { k, Path, Thing } from '../common/GlobalImports'

class Exemplar extends Thing {

	constructor() {
		const name = k.exemplar;
		super(k.empty, name, 'this item is selected', '#b52', '?', true);
		const path = new Path(name)
		this.containsPath = path;
		this.isExemplar = true;
		path._thing = this;
	}

}

export const exemplar = new Exemplar();