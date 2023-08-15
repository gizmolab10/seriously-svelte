import { Thing, crudEditor } from '../common/GlobalImports'

class Exemplar extends Thing {

  constructor() {
    super(crudEditor.newCloudID, 'this is a menu item', 'darkred', '?', 0);
    this.titlePadding = 21;
    this.isExemplar = true;
  }

  get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();