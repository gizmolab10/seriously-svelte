import { Thing, cloud } from '../common/GlobalImports'

class Exemplar extends Thing {

  constructor() {
    super(cloud.newCloudID, 'this is an item', 'darkred', 'h', 0);
    this.titlePadding = 14;
    this.isExemplar = true;
  }

  get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();