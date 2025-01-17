import { k, u, ux, Rect, Size, Point, svgPaths, T_Oblong } from '../../ts/common/Global_Imports';
import type { Integer } from '../common/Types';

export default class Segment_Map {
	relative_font_size = k.font_size;
	title_origin = Point.x(8);
	part = T_Oblong.right;
	font_size = '0.95em';
	origin = Point.zero;
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

	static segment_gap = 14;
	get description(): string { return `${this.title} ${this.part} ${this.path}`; }

	constructor(name: string, title: string, font_size: string, isSelected: boolean, index: Integer, max_index: Integer, left: number, height: number) {
		this.relative_font_size = font_size.fontSize_relativeTo(k.font_size);
		this.width = u.getWidth_ofString_withSize(title, font_size) + this.relative_font_size - 2;
		this.part = this.part_forIndex(index, max_index);
		this.size = new Size(this.width, height);
		this.isSelected = isSelected;
		this.font_size = font_size;
		this.height = height;
		this.title = title;
		this.index = index;
		this.left = left;
		this.name = name;
		this.setup_path();
	}

	static grab_segment_map(name: string, title: string, font_size: string, isSelected: boolean, index: number, max_index: number, left: number, height: number) : Segment_Map {
		let map_name = `${title}-${name}-at-${index}`;
		let map = ux.segment_map_forName(map_name);
		if (!!map) {
			map.isSelected = isSelected;
		} else {
			map = new Segment_Map(name, title, font_size, isSelected, index, max_index, left, height);
			ux.set_segment_map_forName(map, map_name);
		}
		return map;
	}

	setup_path() {
		const isFirst = this.index == 0;
		const title_top = 5 - this.height / 6;
		const size = this.size.expandedEquallyBy(-2);
		const center = this.size.asPoint.dividedInHalf;
		const path_center = center.offsetByXY(isFirst ? 10 : -10, -1);
		const title_x = (isFirst ? 2 : 0) + 1 + this.relative_font_size / 2;
		this.path = svgPaths.oblong(path_center, size, this.part);
		this.title_origin = new Point(title_x, title_top);
		this.viewBox = Rect.createSizeRect(size).viewBox;
		this.origin = Point.x(this.left);
	}

	part_forIndex(index: Integer, max_index: Integer): T_Oblong {
		switch (index) {
			case 0:			return T_Oblong.left;
			case max_index: return T_Oblong.right;
			default:		return T_Oblong.middle;
		}
	}

}