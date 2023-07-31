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

export function sortAccordingToOrder(array: Array<Thing>) {
  return array.sort( (a: Thing, b: Thing) => { return a.order - b.order; });
}

export function normalizeOrderOf(array: Array<Thing>) {
  sortAccordingToOrder(array);
  for (let index = 0; index < array.length; index++) {
    const thing = array[index];
    // alert('NORM: ' + index + ' => ' + thing.order + ' ' + thing.title);
    if (thing.order != index) {
      thing.setOrderTo(index);
      thing.needsSave = true;
    }
  }
}
