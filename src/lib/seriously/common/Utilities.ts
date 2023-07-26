import { v4 as uuid } from 'uuid';
import Thing from '../data/Thing';

export function removeAll(item: string, from: string): string {
  var to = from;
  var length = from.length;
  do {
    length = to.length;
    to = to.replace(item, '');
  } while (length != to.length)
  return to;
}

export function createCloudID(): string {
  return 'rec' + removeAll('-', uuid()).slice(10, 24);
}

export function sortAccordingToOrder(array: Array<Thing>) {
  return array.sort( (a: Thing, b: Thing) => { return a.order - b.order; });
}

export function normalizeOrderOf(array: Array<Thing>) {
  sortAccordingToOrder(array);
  for (let index = 0; index < array.length; index++) {
    const thing = array[index];
    if (thing.order != index) {
      thing.order = index;
      thing.needsSave = true;
    }
  }
}
