import { k, u, ux, Rect, Size, Point, svgPaths, Oblong_Part } from '../../ts/common/Global_Imports';

export default class Segment_Map {
	part = Oblong_Part.right;
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

	static grab_segment_map(name: string, title: string, isSelected: boolean, index: number, max: number, left: number, height: number) : Segment_Map {
		let map_name = `${title}-${name}-at-${index}`;
		let map = ux.segment_map_forName(map_name);
		if (!!map) {
			map.isSelected = isSelected;
		} else {
			map = new Segment_Map(name, title, isSelected, index, max, left, height);
			ux.set_segment_map_forName(map, map_name);
		}
		return map;
	}

	constructor(name: string, title: string, isSelected: boolean, index: number, max: number, left: number, height: number) {
		const gap = 10;		// add gap around title
		this.width = u.getWidthOf(title) + gap;
		this.isSelected = isSelected;
		this.height = height;
		this.title = title;
		this.index = index;
		this.left = left;
		this.name = name;
		this.finish_map(max);
	}

	finish_map(max: number) {
		const raw_size = new Size(this.width, this.height);
		this.size = raw_size.expandedByXY(22, 2)
		this.part = this.part_forIndex(this.index, max);
		this.center = raw_size.dividedInHalf.asPoint.offsetByX(this.left);		// for mouse responder
		this.viewBox = new Rect(Point.zero, raw_size).offsetByX(this.left).viewBox;
		this.path = svgPaths.oblong(this.center, raw_size.expandedByXY(-10, -2), this.part);
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