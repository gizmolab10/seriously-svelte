import { Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';

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

  get lineRects(): Array<LineRect> {
    const quantity = this.thing.children.length;
    const threshold = Math.floor(quantity / 2);
    const hasAFlat = threshold != quantity / 2;
    let rects = Array<LineRect>();
    const size = new Size(30, 12.);
    let origin = this.origin;
    let index = 0;
    while (index < quantity) {
      const delta = threshold - index;
      if (delta == 0 && hasAFlat) {
        rects.push(new LineRect(LineCurveType.flat, new Rect(origin, new Size(30, 0))));
      } else if (delta > 0) {
        rects.push(new LineRect(LineCurveType.down, new Rect(origin, size)));
      } else {
        rects.push(new LineRect(LineCurveType.up, new Rect(origin, size)));
      }
      index += 1;
      origin.y += size.height;
    }
    return rects;
  }
}