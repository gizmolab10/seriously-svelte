import { get, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { height } from '../managers/State'

export default class Layout {
  origin = new Point();
  height: number;
  thing: Thing;

  constructor(thing: Thing, origin: Point) {
    this.origin = origin;
    this.thing = thing;
    this.height = get(height);
  }

  get lineRects(): Array<LineRect> {
    let rects = Array<LineRect>();
    const quantity = this.thing.children.length;
    if (quantity > 0) {
      const half = quantity / 2;
      const threshold = Math.floor(half);
      const hasAFlat = threshold != half; // true only if 'quantity' is odd
      let origin = this.origin;
      let index = 0;
      while (index < quantity) {
        const direction = this.getDirection(threshold - index, hasAFlat);
        const lineOrigen = origin.copy;
        let height = -this.height;
        switch (direction) {
          case LineCurveType.flat:
            lineOrigen.y += this.height;
            height = 0;
            break;
          case LineCurveType.down:
            lineOrigen.y += this.height;
            height = this.height;
            break;
        }
        if (direction != LineCurveType.up) {
          lineOrigen.y += this.height;
        }
        const size = new Size(30, height);
        const rect = new Rect(lineOrigen, size);

        console.log('LAYOUT PUSH:', rect.description, direction, index);

        rects.push(new LineRect(direction, rect));
        index += 1;
      }
    }
    return rects;
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

  get drawnSize(): Size {
    return new Size();
  }
}