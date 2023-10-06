import { graphRect, windowSize } from "../managers/State";
import { get } from "../common/GlobalImports";

export class Point {
	x: number;
	y: number;
	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}
	get verbose():			 		 string { return '(' + this.x + ', ' + this.y + ')'; }
	get description():		 		 string { return this.x + ',' + this.y; }
	get pixelVerbose():				 string { return this.x + 'px ' + this.y + 'px'; }
	get dividedInHalf():			  Point { return this.multipliedBy(1/2); }
	get asSize():					   Size { return new Size(this.x, this.y); }
	get copy():						  Point { return new Point(this.x, this.y); }
	offsetByX(x: number):			  Point { return new Point(this.x + x, this.y); }
	offsetByY(y: number):			  Point { return new Point(this.x, this.y + y); }
	offsetBy(point: Point):			  Point { return new Point(this.x + point.x, this.y + point.y); }
	offsetBySize(size: Size):		  Point { return new Point(this.x + size.width, this.y + size.height); }
	distanceTo(point: Point):		  Point { return new Point(Math.abs(point.x - this.x), Math.abs(point.y - this.y)) }
	multipliedBy(multiplier: number): Point { return new Point(this.x * multiplier, this.y * multiplier) }
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
	get description():				string { return this.width + ',' + this.height; }
	get asPoint():			   		 Point { return new Point(this.width, this.height); }
	get dividedInHalf():			  Size { return this.multipliedBy(1/2); }
	get copy():						  Size { return new Size(this.width, this.height); }
	multipliedBy(multiplier: number): Size { return new Size(this.width * multiplier, this.height * multiplier) }
	expandedBy(size: Size):			  Size { return new Size(this.width + size.width, this.height + size.height); }
	unionWith(size: Size):			  Size { return new Size(Math.max(this.width, size.width), Math.max(this.height, size.height)); }
}

export class Rect {
	origin: Point;
	size: Size;
	constructor(origin: Point = new Point(), size: Size = new Size()) {
		this.origin = origin;
		this.size = size;
	}
	get pixelVerbose():	string { return this.origin.pixelVerbose + ' ' + this.size.pixelVerbose; }
	get description():	string { return this.origin.verbose + ', ' + this.size.verbose; }
	get center():		 Point { return this.origin.offsetBySize(this.size.dividedInHalf); }
	get extent():		 Point { return this.origin.offsetBySize(this.size); }	// bottom right
	get topRight():		 Point { return new Point(this.extent.x, this.origin.y); };
	get bottomLeft():	 Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():	 Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():	 Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():	 Point { return new Point(this.center.x, this.extent.y); };
	get centerTop():	 Point { return new Point(this.center.x, this.origin.y); };
	get copy():			  Rect { return new Rect(this.origin.copy, this.size.copy); }
}

export class LineRect extends Rect {
	curveType: string;
	constructor(curveType: string, rect: Rect) {
		super(rect.origin.copy, rect.size.copy);
		this.curveType = curveType;
	}
};

export function updateGraphRect() {
	const graphOrigin = new Point(101, 33);						// height of top, width of left
	const sizeShrink = graphOrigin.asSize.multipliedBy(-1);
	const newWindowSize = new Size(window.innerWidth, window.innerHeight);
	const graphSize = newWindowSize.expandedBy(sizeShrink);		// remove top and left
	windowSize.set(newWindowSize);								// used by Crumbs
	graphRect.set(new Rect(graphOrigin, graphSize));			// used by Panel and Graph
};
