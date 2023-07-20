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

export function swap<T>(index: number, withIndex: number, within: Array<T>) {
  within.splice(index, 1, within[withIndex]);
  within.splice(withIndex, 1, within[index]);
}

export function reassignOrdersOf(array: Array<Thing>) {
  for (let index = 0; index < array.length; index++) {
      const thing = array[index];
      // alert('' + index + ' : ' + thing.title);
      if (thing.order != index) {
        thing.order = index;
        thing.isDirty = true;
      }
    }
  }
