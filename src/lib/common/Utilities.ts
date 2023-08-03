import { Thing, hierarchy } from './GlobalImports';

export function sortAccordingToOrder(array: Array<Thing>) {
  return array.sort( (a: Thing, b: Thing) => { return a.order - b.order; });
}

export function normalizeOrderOf(array: Array<Thing>) {
  hierarchy.relationships_refreshLookups(); // order is stored in relationships
  sortAccordingToOrder(array);
  for (let index = 0; index < array.length; index++) {
    const thing = array[index];
    if (thing.order != index) {
      thing.setOrderTo(index);
    }
  }
}

export function removeAll(item: string, from: string): string {
  var to = from;
  var length = from.length;
  do {
    length = to.length;
    to = to.replace(item, '');
  } while (length != to.length)
  return to;
}