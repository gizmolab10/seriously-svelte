import { k, u, Rect, Size, Point, svgPaths, Oblong_Part } from '../../ts/common/Global_Imports';

export default class Segment_Map {
	part = Oblong_Part.right;
	origin = Point.zero;
	center = Point.zero;
	isSelected = false;
	viewBox = k.empty;
	size = Size.zero;
	title = k.empty;
	name = k.empty;
	path = k.empty;
	height = 0;
	width = 0;
	index = 0;
	left = 0;

	constructor(name: string, title: string, isSelected: boolean, index: number, max: number, left: number, height: number) {
		this.width = u.getWidthOf(title) + 10;	// add space around title
		this.isSelected = isSelected;
		this.origin = Point.x(left);
		this.height = height;
		this.title = title;
		this.index = index;
		this.left = left;
		this.name = name;
		this.finish_map(max);
	}

	get description(): string { return `${this.title} ${this.part} ${this.path}`; }

	part_forIndex(index: number, max: number): Oblong_Part {
		switch (index) {
			case 0:	  return Oblong_Part.left;
			case max: return Oblong_Part.right;
			default:  return Oblong_Part.middle;
		}
	}

	finish_map(max: number) {
		const viewBox_size = new Size(this.width, this.height);
		this.part = this.part_forIndex(this.index, max);
		this.viewBox = new Rect(Point.x(this.left), viewBox_size).viewBox;
		this.center = this.origin.offsetBy(viewBox_size.dividedInHalf.asPoint);
		this.path = svgPaths.oblong(this.center, viewBox_size.expandedByXY(-10, -2), this.part);
		this.size = viewBox_size.expandedByXY(22, 2)
	}

}