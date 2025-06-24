
import { T_Quadrant, T_Orientation } from '../common/Angle';
import type { SvelteComponent } from 'svelte';
import { tu } from './Testworthy_Utilities';
import Angle from '../common/Angle';

export class Point {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

	get asSize():					  	Size { return new Size(this.x, this.y); }
	get magnitude():				  number { return Math.sqrt(this.x * this.x + this.y * this.y); }
	get toPolar():	{r: number, phi: number} { return {r: this.magnitude, phi: this.angle}; }
	get isZero():					 boolean { return this.x == 0 && this.y == 0; }
	get pixelVerbose():				  string { return `${this.x.toFixed(2)}px ${this.y.toFixed(2)}px`; }
	get verbose():					  string { return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`; }
	get description():				  string { return `${this.x.toFixed(2)} ${this.y.toFixed(2)}`; }
	get negated():					   Point { return this.multipliedBy(-1); }
	get doubled():					   Point { return this.multipliedBy(2); }
	get negatedInHalf():			   Point { return this.dividedBy(-2); }
	get dividedInHalf():			   Point { return this.dividedBy(2); }
	get swap():						   Point { return new Point(this.y, this.x); }
	get negateY():					   Point { return new Point(this.x, -this.y); }
	get negateX():					   Point { return new Point(-this.x, this.y); }
	get abs():						   Point { return new Point(Math.abs(this.x), Math.abs(this.y)); }
	offsetByX(x: number):			   Point { return this.offsetByXY(x, 0); }
	offsetByY(y: number):			   Point { return this.offsetByXY(0, y); }
	offsetEquallyBy(offset: number):   Point { return this.offsetByXY(offset, offset); }
	offsetByXY(x: number, y: number):  Point { return new Point(this.x + x, this.y + y); }
	spreadByXY(x: number, y: number):  Point { return new Point(this.x * x, this.y * y); }
	offsetBy(point: Point):			   Point { return new Point(this.x + point.x, this.y + point.y); }
	vector_to(point: Point):		   Point { return point.offsetBy(this.negated); }
	xMultipliedBy(multiplier: number): Point { return new Point(this.x * multiplier, this.y) }
	yMultipliedBy(multiplier: number): Point { return new Point(this.x, this.y * multiplier) }
	dividedBy(divisor: number):		   Point { return new Point(this.x / divisor, this.y / divisor) }
	multipliedBy(multiplier: number):  Point { return new Point(this.x * multiplier, this.y * multiplier) }
	static polarToo(phi: number, r: number)  { return new Point(Math.cos(phi) * r, Math.sin(phi) * r); }
	static polarTo(phi: number, r: number)   { return Point.x(r).rotate_by(-phi); }
	static fromPolar(r: number, phi: number) { return Point.x(r).rotate_by(phi); }
	static fromDOMRect(rect: DOMRect): Point { return new Point(rect.left, rect.top); }
	static square(length: number):	   Point { return new Point(length, length); }
	static x(x: number):			   Point { return new Point(x, 0); }
	static y(y: number):			   Point { return new Point(0, y); }
	static get zero():				   Point { return new Point();}

	// in this (as in math), y increases going up and angles increase counter-clockwise
	get angle(): number { return (Math.atan2(-this.y, this.x)); }	// in browsers, y is the opposite, so reverse it here

	get quadrant_ofPoint(): T_Quadrant {
		const x = this.x;
		const y = this.y;
		if		  (x >= 0 && y >= 0) { return T_Quadrant.upperRight;
		} else if (x <  0 && y >= 0) { return T_Quadrant.upperLeft;
		} else if (x <  0 && y <  0) { return T_Quadrant.lowerLeft;
		} else						 { return T_Quadrant.lowerRight;
		}
	}

	get orientation_ofVector(): T_Orientation {
		let quadrant = new Angle(this.angle).quadrant_ofAngle;
		const isFirstEighth = (this.angle).normalize_between_zeroAnd(Angle.quarter) < (Math.PI / 4);
		switch (quadrant) {
			case T_Quadrant.upperRight: return isFirstEighth ? T_Orientation.right : T_Orientation.up;
			case T_Quadrant.upperLeft:  return isFirstEighth ? T_Orientation.up	   : T_Orientation.left;
			case T_Quadrant.lowerLeft:  return isFirstEighth ? T_Orientation.left  : T_Orientation.down;
			case T_Quadrant.lowerRight: return isFirstEighth ? T_Orientation.down  : T_Orientation.right;
		}
	}

	rotate_by(angle: number): Point {
		// rotate counter-clockwise
		// angle of zero is on the x-axis pointing right
		// angle of one-half pi is on the y-axis pointing up
		// in math y increases going up,
		// so it must be reversed for browsers
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);
		return new Point(
			this.x * cos + this.y * sin,
			this.y * cos - this.x * sin	// reverse y for browsers
		);
	}
	
	isContainedBy_path(path: string): boolean {
		const canvas = document.createElement('canvas');		// Create a temporary canvas element
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Failed to get 2D context');
		}
		canvas.width = window.innerWidth;		// Set canvas dimensions (arbitrary large values to ensure it covers the path)
		canvas.height = window.innerHeight;
		const path2D = new Path2D(path);		// Create a new Path2D object from the SVG path
		const isInside = context.isPointInPath(path2D, this.x, this.y);		// Check if the point is inside the path
		return isInside;
	}

	static origin_inWindowCoordinates_for(element: HTMLElement): Point {
		let e: HTMLElement | null = element;
		let point = Point.zero;
		while (e) {
			point = point.offsetByXY(e.offsetLeft, e.offsetTop);
			e = e.offsetParent as HTMLElement;
		}
		return point;
	}

}

export class Size {
	width: number;
	height: number;

	constructor(width: number = 0, height: number = 0) {
		this.height = height;
		this.width = width;
	}

	get isZero():					 boolean { return this.width == 0 && this.height == 0; }
	get proportion():				  number { return this.width / this.height; }
	get description():				  string { return `${this.width.toFixed(2)} ${this.height.toFixed(2)}`; }
	get verbose():					  string { return `(${this.width.toFixed(2)}, ${this.height.toFixed(2)})`; }
	get pixelVerbose():				  string { return `${this.width.toFixed(2)}px ${this.height.toFixed(2)}px`; }
	get asPoint():			   		   Point { return new Point(this.width, this.height); }
	get swap():							Size { return new Size(this.height, this.width); }
	get negated():						Size { return this.multipliedBy(-1); }
	get dividedInHalf():				Size { return this.dividedBy(2); }
	reducedByX(x: number):				Size { return this.expandedByXY(-x, 0); }
	reducedByY(y: number):				Size { return this.expandedByXY(0, -y); }
	reducedByXY(x: number, y: number):	Size { return this.expandedByXY(-x, -y); }
	reducedBy(delta: Point):			Size { return this.expandedBy(delta.negated); }
	expandedByX(x: number):				Size { return new Size(this.width + x, this.height); }
	expandedByY(y: number):				Size { return new Size(this.width, this.height + y); }
	expandedByXY(x: number, y: number):	Size { return new Size(this.width + x, this.height + y); }
	expandedEquallyBy(delta: number):	Size { return new Size(this.width + delta, this.height + delta); }
	expandedBy(delta: Point):			Size { return new Size(this.width + delta.x, this.height + delta.y); }
	dividedBy(divisor: number):			Size { return new Size(this.width / divisor, this.height / divisor); }
	multipliedBy(multiplier: number):	Size { return new Size(this.width * multiplier, this.height * multiplier); }
	unionWith(size: Size):				Size { return new Size(Math.max(this.width, size.width), Math.max(this.height, size.height)); }
	subtracting(size: Size):		   Point { return new Point(this.width - size.width, this.height - size.height); }
	best_ratio_to(size: Size):		  number { return Math.min(this.width / size.width, this.height / size.height); }
	static fromDOMRect(rect: DOMRect):	Size { return new Size(rect.width, rect.height); }
	static square(length: number):		Size { return new Size(length, length); }
	static get zero():					Size { return new Size(); }
	static width(width: number):		Size { return new Size(width, 0); }
	static height(height: number):		Size { return new Size(0, height); }

}

export class Rect {
	origin: Point;
	size: Size;

	constructor(origin: Point = Point.zero, size: Size = Size.zero) {
		this.origin = origin;
		this.size = size;
	}

	get x():						 number { return this.origin.x; }
	get y():						 number { return this.origin.y; }
	get width():					 number { return this.size.width; }
	get height():					 number { return this.size.height; }
	get right():					 number { return this.origin.x + this.size.width; }
	get bottom():					 number { return this.origin.y + this.size.height; }
	get isZero():					boolean { return this.origin.isZero && this.size.isZero; }
	get description():				 string { return `${this.origin.verbose}, ${this.size.verbose}`; }
	get viewBox():					 string { return `${this.origin.description} ${this.size.description}`; }
	get pixelVerbose():				 string { return `${this.origin.pixelVerbose} ${this.size.pixelVerbose}`; }
	get center():					  Point { return this.origin.offsetBy(this.size.asPoint.dividedInHalf); }
	get extent():					  Point { return this.origin.offsetBy(this.size.asPoint); }		// bottom right
	get topRight():					  Point { return new Point(this.extent.x, this.origin.y); };
	get centerTop():				  Point { return new Point(this.center.x, this.origin.y); };
	get bottomLeft():				  Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():				  Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():				  Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():				  Point { return new Point(this.center.x, this.extent.y); };
	get dividedInHalf():			   Rect { return new Rect(this.origin, this.size.multipliedBy(-1/2)); }
	get atZero_forX():				   Rect { return new Rect(Point.y(this.origin.y), this.size); }
	get atZero_forY():				   Rect { return new Rect(Point.x(this.origin.x), this.size); }
	get atZero():					   Rect { return new Rect(Point.zero, this.size); }
	static get zero():				   Rect { return new Rect(Point.zero, Size.zero); }
	static createSizeRect(size: Size): Rect { return new Rect(Point.zero, size); }
	offsetEquallyBy(offset: number):   Rect { return this.offsetByXY(offset, offset); }
	offsetByX(x: number):			   Rect { return new Rect(this.origin.offsetByX(x), this.size); }
	offsetByY(y: number):			   Rect { return new Rect(this.origin.offsetByY(y), this.size); }
	offsetBy(delta: Point):			   Rect { return new Rect(this.origin.offsetBy(delta), this.size); }
	offsetByXY(x: number, y: number):  Rect { return new Rect(this.origin.offsetByXY(x, y), this.size); }
	originMultipliedBy(ratio: number): Rect { return new Rect(this.origin.multipliedBy(ratio), this.size); }
	xMultipliedBy(ratio: number):	   Rect { return new Rect(this.origin.xMultipliedBy(ratio), this.size); }
	yMultipliedBy(ratio: number):	   Rect { return new Rect(this.origin.yMultipliedBy(ratio), this.size); }
	multipliedBy(ratio: number):	   Rect { return new Rect(this.origin.multipliedBy(ratio), this.size.multipliedBy(ratio)); }

	expandedBy(expansion: Point): Rect {
		const size = this.size.expandedBy(expansion);
		const origin = expansion.vector_to(this.origin);
		return new Rect(origin, size)
	}

	contains(point: Point): boolean {
		const origin = this.origin;
		const extent = this.extent;
		return point.x.isBetween(origin.x, extent.x, true) && 
			   point.y.isBetween(origin.y, extent.y, true);
	}

	corners_forAngle(angle: number): [Point, Point] {
		switch (new Angle(angle).quadrant_ofAngle) {
			case T_Quadrant.lowerRight: return [this.bottomLeft, this.topRight];
			case T_Quadrant.upperLeft:  return [this.topRight, this.bottomLeft];
			case T_Quadrant.lowerLeft:  return [this.extent, this.origin];
			default:					return [this.origin, this.extent];
		}
	}

	get normalized(): Rect {
		let width = this.width;
		let height = this.height;
		if (width < 0) {
			this.origin.x -= this.size.width = -width;
		}
		if (height < 0) {
			this.origin.y -= this.size.height = -height;
		}
		return this;
	}

	static createWHRect(width: number, height: number): Rect {
		return new Rect(Point.zero, new Size(width, height));
	}
	
	static createExtentRect(origin: Point, extent: Point): Rect {
		return new Rect(origin, origin.vector_to(extent).asSize);
	}

	static createRightCenterRect(rightCenter: Point, size: Size): Rect {
		return new Rect(rightCenter.offsetByY(size.height / -2), size);
	}

	static createCenterRect(center: Point, size: Size): Rect {
		const offset_fromOrigin = size.asPoint.dividedInHalf;
		const origin = center.offsetBy(offset_fromOrigin.negated);
		return new Rect(origin, size);
	}

	static rect_forElement_containsPoint(element: HTMLElement | null, point: Point): boolean {
		const rect = Rect.boundingRectFor(element);
		return rect?.contains(point) ?? false;
	}

	static rect_forElement_containsEvent(element: HTMLElement | null, event: MouseEvent): boolean {
		const rect = Rect.boundingRectFor(element);
		const point = tu.location_ofMouseEvent(event);
		return rect?.contains(point) ?? false;
	}

	static createFromDOMRect(domRect: DOMRect | null) {
		if (!domRect) {
			return null;
		}
		const origin = new Point(domRect.x, domRect.y).offsetByXY(window.scrollX, window.scrollY);
		return new Rect(origin, new Size(domRect.width, domRect.height));
	}

	static rect_forComponent_contains(component: SvelteComponent, event: MouseEvent): boolean {
		const rect = Rect.rect_forComponent(component);
		const point = tu.location_ofMouseEvent(event);
		if (rect.isZero) {
			return false;
		}
		return rect.contains(point);
	}

	static boundingRectFor(element: HTMLElement | null): Rect | null {
		if (!element) {
			return null;
		}
		const domRect = element.getBoundingClientRect();
		const origin = Point.fromDOMRect(domRect);
		const size = Size.fromDOMRect(domRect);
		return new Rect(origin, size);
	}

	static rect_forComponent(c: SvelteComponent): Rect {
		const top = c['offsetTop'];
		const left = c['offsetLeft'];
		const width = c['offsetWidth'];
		const height = c['offsetHeight'];
		if ((!!top || top == 0) && (!!left || left == 0) && !!width && !!height) {
			return new Rect(new Point(left, top), new Size(width, height));
		}
		return Rect.zero;
	}

}
