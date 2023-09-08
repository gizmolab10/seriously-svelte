import { Rect, Size, Point, Thing, LineRect, LineCurveType, get } from '../common/GlobalImports';

export default class Layout {
  origin = new Point();
  thing: Thing;

  constructor(thing: Thing, origin: Point) {
    this.origin = origin;
    this.thing = thing;
  }

  get drawnSize(): Size {
    return new Size();
  }

  getDirection(delta: number, isFlat: Boolean) {
    if (delta == 0 && isFlat) {
      return LineCurveType.flat;
    } else if (delta > 0) {
      return LineCurveType.up;
    } else {
      return LineCurveType.down;
    }
  }

  get lineRects(): Array<LineRect> {
    let rects = Array<LineRect>();
    const quantity = this.thing.children.length;
    if (quantity > 0) {
      const threshold = Math.floor(quantity / 2);
      const isFlat = threshold != quantity / 2;
      const size = new Size(30, 14);
      let origin = this.origin;
      let index = 0;
      while (index < quantity) {
        const delta = threshold - index;
        const direction = this.getDirection(delta, isFlat);
        const isCurved = direction != LineCurveType.flat;
        const lineSize = isCurved ? size : new Size(30, 0);
        const rect = new Rect(origin, lineSize);
        rects.push(new LineRect(direction, rect));
        console.log('LAYOUT rect:', rect.description, 'direction:', direction, 'index:', index);
        index += 1;
        origin.y += size.height;
      }
    }
    return rects;
  }
}