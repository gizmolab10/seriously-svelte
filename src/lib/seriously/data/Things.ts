import { Thing, cloud, relationships, RelationshipKind, hereID, sortAccordingToOrder } from '../common/GlobalImports';

export default class Things {
  thingsByID: { [id: string]: Thing } = {};
  root: Thing | null = null;

  constructor() {}

  get rootID(): (string | null) { return this.root?.id ?? null; };

  thing_ID(id: string | null): Thing | null {
    return (id == null) ? null : this.thingsByID[id];
  }

  things_IDs(ids: Array<string>): Array<Thing> {
    const array = Array<Thing>();
    for (const id of ids) {
      const thing = this.thingsByID[id];
      if (thing != null) {
        array.push(thing);
      }
    }
    return sortAccordingToOrder(array);
  }

}

export const things = new Things();
