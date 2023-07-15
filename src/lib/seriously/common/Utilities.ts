import { v4 as uuid } from 'uuid';

function removeHyphen(from: string): string {
  var to = from;
  var length = from.length;
  do {
    length = to.length;
    to = to.replace('-', '');
  } while (length != to.length)
  return to;
}

function uuidNoHyphen(): string {
  return removeHyphen(uuid());
}

export function cloudID(): string {
  return 'rec' + uuidNoHyphen().slice(10, 24);
}