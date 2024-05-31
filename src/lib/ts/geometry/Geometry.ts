import { Quadrant } from '../common/Enumerations';
import { u } from '../common/Utilities';

export class Point {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	get asSize():					    Size { return new Size(this.x, this.y); }
	get angle():					  number { return Math.atan2(this.x, this.y); }
	get magnitude():				  number { return Math.sqrt(this.x * this.x + this.y * this.y); }
	get toPolar():	{r: number, phi: number} { return {r: this.magnitude, phi: this.angle}; }
	get pixelVerbose():				  string { return `${this.x}px ${this.y}px`; }
	get verbose():					  string { return `(${this.x}, ${this.y})`; }
	get description():				  string { return `${this.x} ${this.y}`; }
	get doubled():					   Point { return this.multipliedBy(2); }
	get negated():					   Point { return this.multipliedBy(-1); }
	get dividedInHalf():			   Point { return this.multipliedBy(1/2); }
	get copy():						   Point { return new Point(this.x, this.y); }
	get swap():						   Point { return new Point(this.y, this.x); }
	get negateY():					   Point { return new Point(this.x, -this.y); }
	get negateX():					   Point { return new Point(-this.x, this.y); }
	get abs():						   Point { return new Point(Math.abs(this.x), Math.abs(this.y)); }
	offsetByX(x: number):			   Point { return new Point(this.x + x, this.y); }
	offsetByY(y: number):			   Point { return new Point(this.x, this.y + y); }
	offsetByXY(x: number, y: number):  Point { return new Point(this.x + x, this.y + y); }
	offsetEquallyBy(offset: number):   Point { return new Point(this.x + offset, this.y + offset); }
	offsetBy(point: Point):			   Point { return new Point(this.x + point.x, this.y + point.y); }
	distanceTo(point: Point):		   Point { return new Point(point.x - this.x, point.y - this.y); }
	distanceFrom(point: Point):		   Point { return new Point(this.x - point.x, this.y - point.y); }
	multipliedBy(multiplier: number):  Point { return new Point(this.x * multiplier, this.y * multiplier) }
	offsetBySize(size: Size):		   Point { return new Point(this.x + size.width, this.y + size.height); }
	almostZero(almost: number):		 boolean { return Math.abs(this.x) <= almost && Math.abs(this.y) <= almost; }
	static fromPolar(r: number, phi: number) { return new Point(r, 0).rotate_by(phi); }
	static square(length: number):	   Point { return new Point(length, length); }
	static get zero():				   Point { return new Point();}

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
	get swap():						  Size { return new Size(this.height, this.width); }
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

	constructor(origin: Point = Point.zero, size: Size = Size.zero) {
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

	expandedBy(expansion: Point): Rect {
		const size = this.size.expandedBy(expansion);
		const origin = this.origin.distanceFrom(expansion);
		return new Rect(origin, size)
	}

	contains(point: Point): boolean {
		const origin = this.origin;
		const extent = this.extent;
		return point.x.isBetween(origin.x, extent.x, true) && 
			   point.y.isBetween(origin.y, extent.y, true);
	}

	cornersForAngle(angle: number): [Point, Point] {
		switch (u.quadrant_ofNotNormalized_angle(angle)) {
			case Quadrant.upperRight: return [this.bottomLeft, this.topRight];
			case Quadrant.lowerLeft:  return [this.topRight, this.bottomLeft];
			case Quadrant.upperLeft:  return [this.extent, this.origin];
			default:				  return [this.origin, this.extent];
		}
	}

	static createExtentRect(origin: Point, extent: Point) {
		return new Rect(origin, extent.distanceFrom(origin).asSize);
	}

	static createCenterRect(center: Point, size: Size) {
		return new Rect(center.distanceFrom(size.asPoint.dividedInHalf), size);
	}

	static createRightCenterRect(rightCenter: Point, size: Size) {
		return new Rect(rightCenter.offsetByY(size.height / -2), size);
	}

	static createFromDOMRect(domRect: DOMRect | null) {
		return !domRect ? null : new Rect(new Point(domRect.x, domRect.y), new Size(domRect.width, domRect.height));
	}

}
