import { Thing, cloud } from '../common/GlobalImports'

class Exemplar extends Thing {

  constructor() {
    super(cloud.newCloudID, 'this is a menu item', 'darkred', 'h', 0);
    this.titlePadding = 21;
    this.isExemplar = true;
  }

  get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();