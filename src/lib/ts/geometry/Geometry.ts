import { graphRect, showDetails, crumbsWidth } from "../managers/State";
import { get, debug, DebugOption } from '../common/GlobalImports'

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
	get dividedInHalf():			  Point { return this.multipliedBy(1/2); }
	get negated():					  Point { return this.multipliedBy(-1); }
	get description():		 		 string { return this.x + ' ' + this.y; }
	offsetByX(x: number):			  Point { return new Point(this.x + x, this.y); }
	offsetByY(y: number):			  Point { return new Point(this.x, this.y + y); }
	offsetBy(point: Point):			  Point { return new Point(this.x + point.x, this.y + point.y); }
	multipliedBy(multiplier: number): Point { return new Point(this.x * multiplier, this.y * multiplier) }
	offsetBySize(size: Size):		  Point { return new Point(this.x + size.width, this.y + size.height); }
	distanceTo(point: Point):		  Point { return new Point(Math.abs(point.x - this.x), Math.abs(point.y - this.y)) }
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
	get description():				string { return this.width + ' ' + this.height; }
	get asPoint():			   		 Point { return new Point(this.width, this.height); }
	get dividedInHalf():			  Size { return this.multipliedBy(1/2); }
	get negated():					  Size { return this.multipliedBy(-1); }
	get copy():						  Size { return new Size(this.width, this.height); }
	reducedBy(delta: Point):		  Size { return new Size(this.width - delta.x, this.height - delta.y); }
	expandedBy(size: Size):			  Size { return new Size(this.width + size.width, this.height + size.height); }
	multipliedBy(multiplier: number): Size { return new Size(this.width * multiplier, this.height * multiplier) }
	unionWith(size: Size):			  Size { return new Size(Math.max(this.width, size.width), Math.max(this.height, size.height)); }
	static square(length: number):	  Size { return new Size(length, length); }
}

export class Rect {
	origin: Point;
	size: Size;

	static createRect(origin: Point, extent: Point) {
		return new Rect(origin, extent.offsetBy(origin.negated).asSize);
	}

	constructor(origin: Point = new Point(), size: Size = new Size()) {
		this.origin = origin;
		this.size = size;
	}

	get pixelVerbose():	   string { return this.origin.pixelVerbose + ' ' + this.size.pixelVerbose; }
	get description():	   string { return this.origin.verbose + ', ' + this.size.verbose; }
	get center():			Point { return this.origin.offsetBySize(this.size.dividedInHalf); }	// add half of size to origin
	get extent():			Point { return this.origin.offsetBySize(this.size); }					// bottom right
	get topRight():			Point { return new Point(this.extent.x, this.origin.y); };
	get bottomLeft():		Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():		Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():		Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():		Point { return new Point(this.center.x, this.extent.y); };
	get centerTop():	 	Point { return new Point(this.center.x, this.origin.y); };
	get copy():			 	 Rect { return new Rect(this.origin.copy, this.size.copy); }
	get dividedInHalf():	 Rect { return this.expandedBy(this.size.multipliedBy(-1/2)); }
	offsetByX(x: number):	 Rect { return new Rect(this.origin.offsetByX(x), this.size); }
	offsetByY(y: number):	 Rect { return new Rect(this.origin.offsetByY(y), this.size); }
	expandedBy(delta: Size): Rect { return new Rect(this.origin, this.size.expandedBy(delta)) }
}

export class LineRect extends Rect {
	curveType: string;
	constructor(curveType: string, rect: Rect) {
		super(rect.origin.copy, rect.size.copy);
		this.curveType = curveType;
	}
};

export function updateGraphRect() {
	const originY = 78;											// height of title at the top
	const originX = get(showDetails) ? 100 : 0;					// width of details
	const mysteryOffset = new Point(originX + 76, 170);					// TODO: why?
	const originOfGraph = new Point(originX, originY);
	const windowSize = new Size(window.innerWidth, window.innerHeight);
	const sizeOfGraph = windowSize.reducedBy(mysteryOffset);	// account for origin
	const rect = new Rect(originOfGraph, sizeOfGraph);
	crumbsWidth.set(sizeOfGraph.width);
	graphRect.set(rect);										// used by Panel and Graph
	if (debug.hasOption(DebugOption.graph)) {
		console.log('GRAPH', rect.description);
	}
};
