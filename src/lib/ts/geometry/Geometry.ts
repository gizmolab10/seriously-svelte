export enum LineCurveType {
  up = 'up',
  down = 'down',
  flat = 'flat',
}

export class Point {
  x: number;
  y: number;
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }
  get description(): string { return this.x + ',' + this.y; }
  get verbose():     string { return '(' + this.x + ', ' + this.y + ')'; }
  offsetBy(point: Point)    { return new Point(this.x + point.x, this.y + point.y); }
  offsetBySize(size: Size)  { return new Point(this.x + size.width, this.y + size.height); }
}

export class Size {
  width: number;
  height: number;
  constructor(width: number = 0, height: number = 0) {
    this.width = width;
    this.height = height;
  }
  get dividedInHalf():        Size { return this.dividedBy(2); }
  get verbose():            string { return '(' + this.width + ', ' + this.height + ')'; }
  get description():        string { return this.width + ',' + this.height; }
  dividedBy(divisor: number): Size { return new Size(this.width / divisor, this.height / divisor) }
  expandedBy(size: Size):     Size { return new Size(this.width + size.width, this.height + size.height); }
}

export class Rect {
  origin: Point;
  size: Size;
  constructor(origin: Point = new Point(), size: Size = new Size()) {
    this.origin = origin;
    this.size = size;
  }
  get description(): string { return this.origin.verbose + ', ' + this.size.verbose; }
  get extent():       Point { return this.origin.offsetBySize(this.size); } // lower right
  get center():       Point { return this.origin.offsetBySize(this.size.dividedInHalf); }
  get topRight():     Point { return this.origin.offsetBy(new Point(this.extent.x, this.origin.y)); };
  get bottomLeft():   Point { return this.origin.offsetBy(new Point(this.origin.x, this.extent.y)); };
  get centerLeft():   Point { return this.origin.offsetBy(new Point(this.origin.x, this.center.y)); };
  get centerRight():  Point { return this.origin.offsetBy(new Point(this.extent.x, this.center.y)); };
  get centerTop():    Point { return this.origin.offsetBy(new Point(this.center.x, this.origin.y)); };
  get centerBottom(): Point { return this.origin.offsetBy(new Point(this.center.x, this.extent.y)); };
}

export class LineRect {
  lineType: string;
  rect: Rect;
  constructor(lineType: string, rect: Rect) {
    this.lineType = lineType;
    this.rect = rect;
  }
};
