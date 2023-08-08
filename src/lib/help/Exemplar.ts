import { Thing, cloud } from '../common/GlobalImports'

class Exemplar extends Thing {

  constructor() {
    super(cloud.newCloudID, 'this is an item', 'green', 'h', 0);
    this.titlePadding = 8;
  }

  get hasChildren(): boolean { return true; }

}

export const exemplar = new Exemplar();