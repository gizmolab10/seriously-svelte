import { Thing, Datum } from '../common/GlobalImports'

class Exemplar extends Thing {

  constructor() {
    super(Datum.newID, 'this item is selected', '#b52', '?', 0, true);
    this.titlePadding = 21;
    this.isExemplar = true;
  }

  get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();