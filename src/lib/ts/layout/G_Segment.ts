import { k, u, ux, Rect, Size, Point, svgPaths, T_Oblong } from '../common/Global_Imports';
import type { Integer } from '../common/Types';

export default class G_Segment {
	numerical_font_size = k.font_size.small;
	font_size = `${k.font_size.small}px`;
	title_origin = Point.x(8);
	part = T_Oblong.right;
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
		this.width = u.getWidth_ofString_withSize(title, font_size) + this.numerical_font_size;
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

	static grab_g_segment(name: string, title: string, font_size: string, isSelected: boolean, index: Integer, max_index: Integer, left: number, height: number) : G_Segment {
		let g_segment_name = `${title}-${name}-at-${index}`;
		let g_segment = ux.g_segment_forName(g_segment_name);
		if (!!g_segment) {
			g_segment.isSelected = isSelected;
		} else {
			g_segment = new G_Segment(name, title, font_size, isSelected, index, max_index, left, height);
			ux.set_g_segment_forName(g_segment, g_segment_name);
		}
		return g_segment;
	}

	setup_path() {
		const isFirst = this.index == 0;
		const size = this.size.expandedEquallyBy(-2);
		const center = this.size.asPoint.dividedInHalf;
		const title_y = (this.height - this.numerical_font_size) / 4;
		const isNormal = (this.height == k.height.segmented) || (this.part === T_Oblong.right);
		const xOffset = isFirst ? 10 : isNormal ? -10 : -8;
		const path_center = center.offsetByXY(xOffset, -1);
		const title_x = (isFirst ? 3 : 0) + this.numerical_font_size / 2;
		this.path = svgPaths.oblong(path_center, size, this.part);
		const viewBoxSize = this.part === T_Oblong.right ? size.expandedByX(1) : size;
		this.viewBox = Rect.createSizeRect(viewBoxSize).viewBox;
		this.title_origin = new Point(title_x, title_y);
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