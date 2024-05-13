import { u, Ancestry, Thing, Quadrant } from '../common/GlobalImports'

export class Point {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	get asSize():					    Size { return new Size(this.x, this.y); }
	get abs():						   Point { return new Point(Math.abs(this.x), Math.abs(this.y)); }
	get pixelVerbose():				  string { return `${this.x}px ${this.y}px`; }
	get verbose():					  string { return `(${this.x}, ${this.y})`; }
	get description():				  string { return `${this.x} ${this.y}`; }
	get doubled():					   Point { return this.multipliedBy(2); }
	get negated():					   Point { return this.multipliedBy(-1); }
	get dividedInHalf():			   Point { return this.multipliedBy(1/2); }
	get copy():						   Point { return new Point(this.x, this.y); }
	offsetByX(x: number):			   Point { return new Point(this.x + x, this.y); }
	offsetByY(y: number):			   Point { return new Point(this.x, this.y + y); }
	offsetBy(point: Point):			   Point { return new Point(this.x + point.x, this.y + point.y); }
	multipliedBy(multiplier: number):  Point { return new Point(this.x * multiplier, this.y * multiplier) }
	offsetBySize(size: Size):		   Point { return new Point(this.x + size.width, this.y + size.height); }
	distanceTo(point: Point):		   Point { return new Point(Math.abs(point.x - this.x), Math.abs(point.y - this.y)) }
	offsetEquallyBy(offset: number):   Point { return this.offsetBy(Point.square(offset)); }
	static square(length: number):	   Point { return new Point(length, length); }
	static get zero():				   Point { return new Point();}
	static fromPolar(r: number, phi: number) { return new Point(r, 0).rotate_by(phi); }

	rotate_by(angle: number): Point {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			this.x * cos + this.y * sin,
			this.y * cos - this.x * sin
		);
	}
}

export class Size {
	width: number;
	height: number;

	constructor(width: number = 0, height: number = 0) {
		this.height = height;
		this.width = width;
	}

	get proportion():				number { return this.width / this.height; }
	get description():				string { return `${this.width} ${this.height}`; }
	get verbose():					string { return `(${this.width}, ${this.height})`; }
	get pixelVerbose():				string { return `${this.width}px ${this.height}px`; }
	get asPoint():			   		 Point { return new Point(this.width, this.height); }
	get dividedInHalf():			  Size { return this.multipliedBy(1/2); }
	get negated():					  Size { return this.multipliedBy(-1); }
	get copy():						  Size { return new Size(this.width, this.height); }
	expandedByX(width: number):		  Size { return new Size(this.width + width, this.height); }
	expandedByY(height: number):	  Size { return new Size(this.width, this.height + height); }
	expandedBy(delta: Point):		  Size { return new Size(this.width + delta.x, this.height + delta.y); }
	multipliedBy(multiplier: number): Size { return new Size(this.width * multiplier, this.height * multiplier); }
	unionWith(size: Size):			  Size { return new Size(Math.max(this.width, size.width), Math.max(this.height, size.height)); }
	subtracting(size: Size):		 Point { return new Point(this.width - size.width, this.height - size.height); }
	reducedBy(delta: Point):		  Size { return this.expandedBy(delta.negated); }
	static square(length: number):	  Size { return new Size(length, length); }
	static get zero():				  Size { return new Size(); }
}

export class Rect {
	origin: Point;
	size: Size;

	constructor(origin: Point = new Point(), size: Size = new Size()) {
		this.origin = origin;
		this.size = size;
	}

	get description():		 string { return `${this.origin.verbose}, ${this.size.verbose}`; }
	get pixelVerbose():		 string { return `${this.origin.pixelVerbose}, ${this.size.pixelVerbose}`; }
	get rangeDescription():	 string { return `(${this.origin.x} ... ${this.extent.x}), (${this.origin.y} ... ${this.extent.y})`; }
	get center():			  Point { return this.origin.offsetBySize(this.size.dividedInHalf); }
	get extent():			  Point { return this.origin.offsetBySize(this.size); }		// bottom right
	get topRight():			  Point { return new Point(this.extent.x, this.origin.y); };
	get centerTop():		  Point { return new Point(this.center.x, this.origin.y); };
	get bottomLeft():		  Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():		  Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():		  Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():		  Point { return new Point(this.center.x, this.extent.y); };
	get copy():				   Rect { return new Rect(this.origin.copy, this.size.copy); }
	get dividedInHalf():	   Rect { return new Rect(this.origin, this.size.multipliedBy(-1/2)); }
	offsetBy(delta: Point):	   Rect { return new Rect(this.origin.offsetBy(delta), this.size); }
	offsetByY(y: number):	   Rect { return new Rect(this.origin.offsetByY(y), this.size); }
	offsetByX(x: number):	   Rect { return new Rect(this.origin.offsetByX(x), this.size); }
	contains(point: Point): boolean { return point.x.isBetween(this.origin.x, this.extent.x, true) && point.y.isBetween(this.origin.y, this.extent.y, true); }

	expandedBy(expansion: Point): Rect {
		const size = this.size.expandedBy(expansion);
		const origin = this.origin.offsetBy(expansion.negated);
		return new Rect(origin, size)
	}

	cornersForAngle(angle: number): [Point, Point] {
		switch (u.quadrant_of(angle)) {
			case Quadrant.upperRight: return [this.bottomLeft, this.topRight];
			case Quadrant.lowerLeft:  return [this.topRight, this.bottomLeft];
			case Quadrant.upperLeft:  return [this.extent, this.origin];
			default:				  return [this.origin, this.extent];
		}
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

	static createFromDOMRect(domRect: DOMRect | null) {
		return !domRect ? null : new Rect(new Point(domRect.x, domRect.y), new Size(domRect.width, domRect.height));
	}

}

export class ChildMapRect extends Rect {
	childAngle: number | null;
	childAncestry: Ancestry | null;
	child: Thing | null;
	childOrigin: Point;
	curveType: string;
	ancestry: Ancestry | null;

	constructor(curveType: string, rect: Rect, childOrigin: Point, childAncestry: Ancestry | null, ancestry: Ancestry | null, childAngle: number | null = null) {
		super(rect.origin.copy, rect.size.copy);
		this.child = childAncestry?.thing ?? null;
		this.childOrigin = childOrigin;
		this.childAngle = childAngle;
		this.childAncestry = childAncestry;
		this.curveType = curveType;
		this.ancestry = ancestry;
		if (!this.child) {
			console.log('Geometry ChildMapRect ... has no child');
		}
	}
}
