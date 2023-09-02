import { Thing, dbDispatch } from '../common/GlobalImports'

class Exemplar extends Thing {

  constructor() {
    super(dbDispatch.db.newCloudID, 'this item is selected', '#5c920c', '?', 0, true);
    this.titlePadding = 21;
    this.isExemplar = true;
  }

  get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();