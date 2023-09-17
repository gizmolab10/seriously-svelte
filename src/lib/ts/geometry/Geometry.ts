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
	get copy():					Point { return new Point(this.x, this.y); }
	get description():	string { return this.x + ',' + this.y; }
	get asSize():					Size { return new Size(this.x, this.y); }
	get pxDescription(): string { return this.x + 'px ' + this.y + 'px'; }
	get verbose():			string { return '(' + this.x + ', ' + this.y + ')'; }
	offsetBy(point: Point)			{ return new Point(this.x + point.x, this.y + point.y); }
	offsetBySize(size: Size)		{ return new Point(this.x + size.width, this.y + size.height); }
	distanceTo(point: Point)		{ return new Point(Math.abs(point.x - this.x), Math.abs(point.y - this.y)) }
}

export class Size {
	width: number;
	height: number;
	constructor(width: number = 100, height: number = 0) {
		this.width = width;
		this.height = height;
	}
	get copy():								Size { return new Size(this.width, this.height); }
	get asPoint():						Point { return new Point(this.width, this.height); }
	get dividedInHalf():				Size { return this.dividedBy(2); }
	get description():				string { return this.width + ',' + this.height; }
	get pxDescription():			string { return this.width + 'px ' + this.height + 'px'; }
	get verbose():						string { return '(' + this.width + ', ' + this.height + ')'; }
	dividedBy(divisor: number): Size { return new Size(this.width / divisor, this.height / divisor) }
	expandedBy(size: Size):		Size { return new Size(this.width + size.width, this.height + size.height); }
}

export class Rect {
	origin: Point;
	size: Size;
	constructor(origin: Point = new Point(), size: Size = new Size()) {
		this.origin = origin;
		this.size = size;
	}
	get copy():						Rect { return new Rect(this.origin.copy, this.size.copy); }
	get description():	string { return this.origin.verbose + ', ' + this.size.verbose; }
	get pxDescription(): string { return this.origin.pxDescription + ' ' + this.size.pxDescription; }
	get extent():				Point { return this.origin.offsetBySize(this.size); }	// bottom right
	get center():				Point { return this.origin.offsetBySize(this.size.dividedInHalf); }
	get topRight():			Point { return new Point(this.extent.x, this.origin.y); };
	get bottomLeft():		Point { return new Point(this.origin.x, this.extent.y); };
	get centerLeft():		Point { return new Point(this.origin.x, this.center.y); };
	get centerRight():		Point { return new Point(this.extent.x, this.center.y); };
	get centerBottom():	Point { return new Point(this.center.x, this.extent.y); };
	get centerTop():			Point { return new Point(this.center.x, this.origin.y); };
}

export class LineRect extends Rect {
	lineType: string;
	constructor(lineType: string, rect: Rect) {
		super(rect.origin.copy, rect.size.copy);
		this.lineType = lineType;
	}
};
