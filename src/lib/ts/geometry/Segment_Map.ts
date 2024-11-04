import { k, u, ux, Rect, Size, Point, svgPaths, Oblong_Part } from '../../ts/common/Global_Imports';

export default class Segment_Map {
	title_origin = Point.x(8);
	part = Oblong_Part.right;
	font_size = '0.95em';
	center = Point.zero;
	isSelected = false;
	viewBox = k.empty;
	size = Size.zero;
	title = k.empty;
	name = k.empty;
	path = k.empty;
	height = 0;
	index = 0;
	left = 0;

	static segment_gap = 14;
	get description(): string { return `${this.title} ${this.part} ${this.path}`; }
	get width(): number { return u.getWidth_ofString_withSize(this.title, this.font_size) + 8; }

	constructor(name: string, title: string, font_size: string, isSelected: boolean, index: number, max: number, left: number, height: number) {
		this.isSelected = isSelected;
		this.font_size = font_size;
		this.height = height;
		this.title = title;
		this.index = index;
		this.left = left;
		this.name = name;
		this.finish_map(max);
	}

	static grab_segment_map(name: string, title: string, font_size: string, isSelected: boolean, index: number, max: number, left: number, height: number) : Segment_Map {
		let map_name = `${title}-${name}-at-${index}`;
		let map = ux.segment_map_forName(map_name);
		if (!!map) {
			map.isSelected = isSelected;
		} else {
			map = new Segment_Map(name, title, font_size, isSelected, index, max, left, height);
			ux.set_segment_map_forName(map, map_name);
		}
		return map;
	}

	finish_map(max: number) {
		const raw_size = new Size(this.width, this.height);
		this.size = raw_size.expandedByXY(Segment_Map.segment_gap, 2);
		this.part = this.part_forIndex(this.index, max);
		this.setup_path(raw_size);
	}

	setup_path(raw_size: Size) {
		const isFirst = this.index == 0;
		const title_top = 4.5 - this.height / 6;
		const center = raw_size.dividedInHalf.asPoint;
		const size = raw_size.expandedByX(isFirst ? -14 : -2);
		const path_center = center.offsetByX(isFirst ? 0 : -10);
		this.path = svgPaths.oblong(path_center, size.expandedByY(-2), this.part);
		this.title_origin = new Point(isFirst ? 20 : 10, title_top);
		this.viewBox = Rect.createSizeRect(size).viewBox;
		this.center = center.offsetByX(this.left);
	}

	part_forIndex(index: number, max: number): Oblong_Part {
		switch (index) {
			case 0:	  return Oblong_Part.left;
			case max: return Oblong_Part.right;
			default:  return Oblong_Part.middle;
		}
	}

}