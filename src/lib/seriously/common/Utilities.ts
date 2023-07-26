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

export function moveElementWithin<T>(array: Array<T>, from: number, to: number) {
  const contiguous = Math.abs(to - from) == 1;
  const toLessThanFrom = to > from;
  const retain = toLessThanFrom && contiguous
  const first = retain ? to : from;
  const second = retain ? from : to;
  const mover = array.splice(first, 1)[0]
  array.splice(second, 0, mover);
}

export function normalizeOrderOf(array: Array<Thing>) {
  for (let index = 0; index < array.length; index++) {
      const thing = array[index];
      if (thing.order != index) {
        thing.order = index;
        thing.needsSave = true;
      }
    }
  }
