import { k, Path, Thing } from '../common/GlobalImports'

class Exemplar extends Thing {
	path: Path;

	constructor() {
		const name = k.exemplar;
		super(k.empty, name, 'this item is selected', '#b52', '?', true);
		const path = new Path(name)
		this.isExemplar = true;
		path._thing = this;
		this.path = path;
	}

}

export const exemplar = new Exemplar();