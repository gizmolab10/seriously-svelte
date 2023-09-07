export enum LineCurveType {
  up,
  down,
  flat,
}

export class Point {
  x: number;
  y: number;
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
  get description(): string { return this.x + ',' + this.y; }
  add(point: Point) { return new Point(this.x + point.x, this.y + point.y); }
  addSize(size: Size) { return new Point(this.x + size.width, this.y + size.height); }
}

export class Size {
  width: number;
  height: number;
  constructor(width: number = 0, height: number = 0) {
    this.width = width;
    this.height = height;
  }
  get description(): string  { return this.width + ',' + this.height; }
  add(size: Size)            { return new Point(this.width + size.width, this.height + size.height); }
  dividedBy(divisor: number) { return new Size(this.width / divisor, this.height / divisor) }
  get dividedInHalf()        { return this.dividedBy(2); }
}

export class Rect {
  origin: Point;
  size: Size;
  constructor(origin: Point = new Point(), size: Size = new Size()) {
    this.origin = origin;
    this.size = size;
  }
  get extent():     Point { return this.origin.addSize(this.size); }
  get center():     Point { return this.origin.addSize(this.size.dividedInHalf); }
  get lowerLeft():  Point { return this.origin.add(new Point(0, this.size.height)); };
  get upperRight(): Point { return this.origin.add(new Point(this.size.width, 0)); };
}

export class LineRect {
  lineType: LineCurveType;
  rect: Rect;
  constructor(lineType: LineCurveType, rect: Rect) {
    this.lineType = lineType;
    this.rect = rect;
  }
};
