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

	constructor(title: string, index: number, max: number, left: number, height: number) {
		this.left = left;
		this.title = title;
		this.index = index;
		this.height = height;
		this.origin = new Point(left, 0);
		this.width = u.getWidthOf(title) + 15;
		this.size = new Size(this.width, height);
		this.part = this.part_forIndex(index, max);
		this.center = this.origin.offsetByXY(15, height / 2);
		this.path = svgPaths.oblong(this.center, this.size, this.part);
		this.viewBox = new Rect(new Point(left, 0), this.size).viewBox;
	}

	get description(): string { return `${this.title} ${this.part} ${this.path}`; }

	part_forIndex(index: number, max: number): Oblong_Part {
		switch (index) {
			case 0:	  return Oblong_Part.left;
			case max: return Oblong_Part.right;
			default:  return Oblong_Part.middle;
		}
	}

}