import { k, u, Rect, Size, Point, svgPaths, Oblong_Part } from '../../ts/common/Global_Imports';

export default class Segment_Map {
	part = Oblong_Part.right;
	origin = Point.zero;
	center = Point.zero;
	viewBox = k.empty;
	size = Size.zero;
	title = k.empty;
	path = k.empty;
	height = 0;
	width = 0;
	index = 0;
	left = 0;

	constructor(title: string, index: number, left: number, height: number, part: Oblong_Part = Oblong_Part.right) {
		this.left = left;
		this.part = part;
		this.title = title;
		this.index = index;
		this.height = height;
		this.origin = new Point(this.left, 0);
		this.width = u.getWidthOf(this.title) + 20;
		this.size = new Size(this.width, this.height);
		this.center = new Point(this.left, this.height / 2);
		this.path = svgPaths.oblong(this.center, this.size, this.part);
		this.viewBox = new Rect(new Point(this.left, 0), this.size).viewBox;
	}

	get description(): string { return `${this.title} ${this.part} ${this.path}`; }

}