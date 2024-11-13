
import { Quadrant, Orientation } from '../geometry/Angle';
import type { SvelteComponent } from 'svelte';
import { u } from '../common/Utilities';
import Angle from '../geometry/Angle';

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
	get doubled():					   Point { return this.multipliedBy(2); }
	get negated():					   Point { return this.multipliedBy(-1); }
	get dividedInHalf():			   Point { return this.multipliedBy(1/2); }
	get negatedInHalf():			   Point { return this.multipliedBy(-1/2); }
	get copy():						   Point { return new Point(this.x, this.y); }
	get swap():						   Point { return new Point(this.y, this.x); }
	get negateY():					   Point { return new Point(this.x, -this.y); }
	get negateX():					   Point { return new Point(-this.x, this.y); }
	get abs():						   Point { return new Point(Math.abs(this.x), Math.abs(this.y)); }
	offsetByX(x: number):			   Point { return this.offsetByXY(x, 0); }
	offsetByY(y: number):			   Point { return this.offsetByXY(0, y); }
	offsetByXY(x: number, y: number):  Point { return new Point(this.x + x, this.y + y); }
	offsetEquallyBy(offset: number):   Point { return this.offsetByXY(offset, offset); }
	offsetBy(point: Point):			   Point { return new Point(this.x + point.x, this.y + point.y); }
	vector_to(point: Point):		   Point { return point.offsetBy(this.negated); }
	vector_from(point: Point):		   Point { return point.vector_to(this); }
	multipliedBy(multiplier: number):  Point { return new Point(this.x * multiplier, this.y * multiplier) }
	static fromPolar(r: number, phi: number) { return Point.x(r).rotate_by(phi); }
	static fromDOMRect(rect: DOMRect): Point { return new Point(rect.left, rect.top); }
	static square(length: number):	   Point { return new Point(length, length); }
	static x(x: number):			   Point { return new Point(x, 0); }
	static y(y: number):			   Point { return new Point(0, y); }
	static get zero():				   Point { return new Point();}

	// in this (as in math), y increases going up and angles increase counter-clockwise
	get angle(): number { return (Math.atan2(-this.y, this.x)); }	// in browsers, y is the opposite, so reverse it here

	get quadrant_ofPoint(): Quadrant {
		const x = this.x;
		const y = this.y;
		if		  (x >= 0 && y >= 0) { return Quadrant.upperRight;
		} else if (x <  0 && y >= 0) { return Quadrant.upperLeft;
		} else if (x <  0 && y <  0) { return Quadrant.lowerLeft;
		} else						 { return Quadrant.lowerRight;
		}
	}

	get orientation_ofVector(): Orientation {
		let quadrant = new Angle(this.angle).quadrant_ofAngle;
		const isFirstEighth = (this.angle).normalize_between_zeroAnd(Angle.quarter) < (Math.PI / 4);
		switch (quadrant) {
			case Quadrant.upperRight: return isFirstEighth ? Orientation.right : Orientation.up;
			case Quadrant.upperLeft:  return isFirstEighth ? Orientation.up	   : Orientation.left;
			case Quadrant.lowerLeft:  return isFirstEighth ? Orientation.left  : Orientation.down;
			case Quadrant.lowerRight: return isFirstEighth ? Orientation.down  : Orientation.right;
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
			  this.x * cos - this.y * sin,
			-(this.y * cos + this.x * sin)	// reverse y for browsers
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
	get dividedInHalf():				Size { return this.multipliedBy(1/2); }
	get negated():						Size { return this.multipliedBy(-1); }
	get copy():							Size { return new Size(this.width, this.height); }
	get swap():							Size { return new Size(this.height, this.width); }
	reducedBy(delta: Point):			Size { return this.expandedBy(delta.negated); }
	expandedByX(width: number):			Size { return new Size(this.width + width, this.height); }
	expandedByY(height: number):		Size { return new Size(this.width, this.height + height); }
	expandedEquallyBy(delta: number):	Size { return new Size(this.width + delta, this.height + delta); }
	expandedBy(delta: Point):			Size { return new Size(this.width + delta.x, this.height + delta.y); }
	expandedByXY(x: number, y: number):	Size { return new Size(this.width + x, this.height + y); }
	multipliedBy(multiplier: number):	Size { return new Size(this.width * multiplier, this.height * multiplier); }
	unionWith(size: Size):				Size { return new Size(Math.max(this.width, size.width), Math.max(this.height, size.height)); }
	subtracting(size: Size):		   Point { return new Point(this.width - size.width, this.height - size.height); }
	static fromDOMRect(rect: DOMRect):	Size { return new Size(rect.width, rect.height); }
	static square(length: number):		Size { return new Size(length, length); }
	static get zero():					Size { return new Size(); }

}

export class Rect {
	origin: Point;
	size: Size;

	constructor(origin: Point = Point.zero, size: Size = Size.zero) {
		this.origin = origin;
		this.size = size;
	}

	get isZero():			  boolean { return this.origin.isZero && this.size.isZero; }
	get description():		   string { return `${this.origin.verbose}, ${this.size.verbose}`; }
	get viewBox():			   string { return `${this.origin.description} ${this.size.description}`; }
	get pixelVerbose():		   string { return `${this.origin.pixelVerbose} ${this.size.pixelVerbose}`; }
	get rangeDescription():	   string { return `(${this.origin.x.toFixed(2)} ... ${this.extent.x.toFixed(2)}), (${this.origin.y.toFixed(2)} ... ${this.extent.y.toFixed(2)})`; }
	get center():				Point { return this.origin.offsetBy(this.size.asPoint.dividedInHalf); }
	get extent():				Point { return this.origin.offsetBy(this.size.asPoint); }		// bottom right
	get topRight():				Point { return new Point(this.extent.x, this.origin.y); };
	get centerTop():			Point { return new Point(this.center.x, this.origin.y); };
	get bottomLeft():			Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():			Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():			Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():			Point { return new Point(this.center.x, this.extent.y); };
	get copy():					 Rect { return new Rect(this.origin.copy, this.size.copy); }
	get dividedInHalf():		 Rect { return new Rect(this.origin, this.size.multipliedBy(-1/2)); }
	get atZero_forX():			 Rect { return new Rect(Point.y(this.origin.y), this.size); }
	get atZero_forY():			 Rect { return new Rect(Point.x(this.origin.x), this.size); }
	get atZero():				 Rect { return new Rect(Point.zero, this.size); }
	static get zero():			 Rect { return new Rect(Point.zero, Size.zero); }
	static createSizeRect(size: Size) { return new Rect(Point.zero, size); }
	offsetBy(delta: Point):		 Rect { return new Rect(this.origin.offsetBy(delta), this.size); }
	offsetByY(y: number):		 Rect { return new Rect(this.origin.offsetByY(y), this.size); }
	offsetByX(x: number):		 Rect { return new Rect(this.origin.offsetByX(x), this.size); }

	expandedBy(expansion: Point): Rect {
		const size = this.size.expandedBy(expansion);
		const origin = this.origin.vector_from(expansion);
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
			case Quadrant.lowerRight: return [this.bottomLeft, this.topRight];
			case Quadrant.upperLeft:  return [this.topRight, this.bottomLeft];
			case Quadrant.lowerLeft:  return [this.extent, this.origin];
			default:				  return [this.origin, this.extent];
		}
	}

	static createExtentRect(origin: Point, extent: Point) {
		return new Rect(origin, extent.vector_from(origin).asSize);
	}

	static createRightCenterRect(rightCenter: Point, size: Size) {
		return new Rect(rightCenter.offsetByY(size.height / -2), size);
	}

	static createCenterRect(center: Point, size: Size) {
		const offset_fromOrigin = size.asPoint.dividedInHalf;
		const origin = center.offsetBy(offset_fromOrigin.negated);
		return new Rect(origin, size);
	}

	static rect_forElement_contains(element: HTMLElement | null, point: Point): boolean {
		const rect = Rect.boundingRectFor(element);
		return rect?.contains(point) ?? false;
	}

	static rect_forElement_containsEvent(element: HTMLElement | null, event: MouseEvent): boolean {
		const point = u.pointFor_mouseEvent(event);
		const rect = Rect.boundingRectFor(element);
		return rect?.contains(point) ?? false;
	}

	static createFromDOMRect(domRect: DOMRect | null) {
		if (!!domRect) {
			const origin = new Point(domRect.x, domRect.y).offsetByXY(window.scrollX, window.scrollY);
			return new Rect(origin, new Size(domRect.width, domRect.height));
		}
		return null;
	}

	static rect_forComponent_contains(component: SvelteComponent, event: MouseEvent): boolean {
		const rect = Rect.rect_forComponent(component);
		const point = u.pointFor_mouseEvent(event);
		if (rect.isZero) {
			return false;
		}
		return rect.contains(point);
	}

	static boundingRectFor(element: HTMLElement | null): Rect | null {
		if (!!element) {
			const domRect = element.getBoundingClientRect();
			const origin = Point.fromDOMRect(domRect);
			const size = Size.fromDOMRect(domRect);
			return new Rect(origin, size);
		}
		return null;
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
