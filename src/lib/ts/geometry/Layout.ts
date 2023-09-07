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
    let rects = Array<LineRect>();
    let index = 0;
    while (index < quantity) {
      const delta = (quantity / 2) - index;
      if (delta < 0) {
        rects.push(new LineRect(LineCurveType.up, new Rect()));
      } else if (delta > 0) {
        rects.push(new LineRect(LineCurveType.down, new Rect()));
      } else {
        rects.push(new LineRect(LineCurveType.flat, new Rect()));
      }
      index += 1;
    }
    return rects;
  }
}