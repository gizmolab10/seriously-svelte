import { v4 as uuid } from 'uuid';

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
  const indexItem = within[index];
  const withIndexItem = within[withIndex];
  within.splice(index, 1, withIndexItem);
  within.splice(withIndex, 1, indexItem);
}

const stringArraySeparator = ' <[:]> '

export function convertArrayToString(array: Array<string>): string {
  return array.join(stringArraySeparator);
}

export function convertStringToArray(single: string): Array<string> {
  return single.includes(stringArraySeparator) ? single.split(stringArraySeparator) : [single];
}