import { k, Path, Thing } from '../common/GlobalImports'

export class Point {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}
	get verbose():			 		 string { return '(' + this.x + ', ' + this.y + ')'; }
	get pixelVerbose():				 string { return this.x + 'px ' + this.y + 'px'; }
	get copy():						  Point { return new Point(this.x, this.y); }
	get asSize():					   Size { return new Size(this.x, this.y); }
	get description():		 		 string { return this.x + ', ' + this.y; }
	get dividedInHalf():			  Point { return this.multipliedBy(1/2); }
	get negated():					  Point { return this.multipliedBy(-1); }
	offsetByX(x: number):			  Point { return new Point(this.x + x, this.y); }
	offsetByY(y: number):			  Point { return new Point(this.x, this.y + y); }
	offsetEquallyBy(offset: number):  Point { return this.offsetBy(Point.square(offset)); }
	offsetBy(point: Point):			  Point { return new Point(this.x + point.x, this.y + point.y); }
	multipliedBy(multiplier: number): Point { return new Point(this.x * multiplier, this.y * multiplier) }
	offsetBySize(size: Size):		  Point { return new Point(this.x + size.width, this.y + size.height); }
	distanceTo(point: Point):		  Point { return new Point(Math.abs(point.x - this.x), Math.abs(point.y - this.y)) }
	static square(length: number):	  Point { return new Point(length, length); }

	rotateBy(angle: number): Point {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			this.x * cos - this.y * sin,
			this.x * sin + this.y * cos
		);
	}
}

export class Size {
	width: number;
	height: number;

	constructor(width: number = 0, height: number = 0) {
		this.width = width;
		this.height = height;
	}

	get verbose():					string { return '(' + this.width + ', ' + this.height + ')'; }
	get pixelVerbose():				string { return this.width + 'px ' + this.height + 'px'; }
	get description():				string { return this.width + k.space + this.height; }
	get asPoint():			   		 Point { return new Point(this.width, this.height); }
	get dividedInHalf():			  Size { return this.multipliedBy(1/2); }
	get negated():					  Size { return this.multipliedBy(-1); }
	get copy():						  Size { return new Size(this.width, this.height); }
	expandedByX(width: number):		  Size { return new Size(this.width + width, this.height); }
	expandedByY(height: number):	  Size { return new Size(this.width, this.height + height); }
	reducedBy(delta: Point):		  Size { return new Size(this.width - delta.x, this.height - delta.y); }
	expandedBy(size: Size):			  Size { return new Size(this.width + size.width, this.height + size.height); }
	multipliedBy(multiplier: number): Size { return new Size(this.width * multiplier, this.height * multiplier) }
	unionWith(size: Size):			  Size { return new Size(Math.max(this.width, size.width), Math.max(this.height, size.height)); }
	static square(length: number):	  Size { return new Size(length, length); }
}

export class Rect {
	origin: Point;
	size: Size;

	constructor(origin: Point = new Point(), size: Size = new Size()) {
		this.origin = origin;
		this.size = size;
	}

	static createExtentRect(origin: Point, extent: Point) {
		return new Rect(origin, extent.offsetBy(origin.negated).asSize);
	}

	static createCenterRect(center: Point, size: Size) {
		return new Rect(center.offsetBy(size.asPoint.negated.dividedInHalf), size);
	}

	static createRightCenterRect(rightCenter: Point, size: Size) {
		return new Rect(rightCenter.offsetByY(size.height / -2), size);
	}

	static createFromDOMRect(rect: DOMRect | null) {
		return !rect ? null : new Rect(new Point(rect.x, rect.y), new Size(rect.width, rect.height));
	}

	get description():	   string { return this.origin.verbose + ', ' + this.size.verbose; }
	get pixelVerbose():	   string { return this.origin.pixelVerbose + k.space + this.size.pixelVerbose; }
	get center():			Point { return this.origin.offsetBySize(this.size.dividedInHalf); }
	get extent():			Point { return this.origin.offsetBySize(this.size); }		// bottom right
	get topRight():			Point { return new Point(this.extent.x, this.origin.y); };
	get centerTop():	 	Point { return new Point(this.center.x, this.origin.y); };
	get bottomLeft():		Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():		Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():		Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():		Point { return new Point(this.center.x, this.extent.y); };
	get copy():			 	 Rect { return new Rect(this.origin.copy, this.size.copy); }
	get dividedInHalf():	 Rect { return this.expandedBy(this.size.multipliedBy(-1/2)); }
	offsetByX(x: number):	 Rect { return new Rect(this.origin.offsetByX(x), this.size); }
	offsetByY(y: number):	 Rect { return new Rect(this.origin.offsetByY(y), this.size); }
	offsetBy(delta: Point):	 Rect { return new Rect(this.origin.offsetBy(delta), this.size); }
	expandedBy(delta: Size): Rect { return new Rect(this.origin, this.size.expandedBy(delta)) }
}

export class ChildMapRect extends Rect {
	childPath: Path | null;
	child: Thing | null;
	childOrigin: Point;
	curveType: string;
	path: Path | null;

	constructor(curveType: string, rect: Rect, childOrigin: Point, childPath: Path | null, path: Path | null) {
		super(rect.origin.copy, rect.size.copy);
		this.child = childPath?.thing ?? null;
		this.childOrigin = childOrigin;
		this.childPath = childPath;
		this.curveType = curveType;
		this.path = path;

		if (this.child == null) {
			console.log('ChildMapRect: null childPath.thing');
		}
	}
}
