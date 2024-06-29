import { k, Rect, Size, Point, IDLine, Ancestry, Widget_MapRect } from '../common/Global_Imports';

export default class Tree_Geometry {
	childHeight = 0;
	widgetMapRects: Array<Widget_MapRect> = [];

	constructor(sum: number, ancestry: Ancestry, childAncestry: Ancestry, origin: Point) {
		const childHeight = childAncestry.visibleProgeny_height();
		const sizeY = sum + childHeight / 2;
		const direction = this.getDirection(sizeY);
		const rect = new Rect(origin, new Size(k.line_stretch, sizeY - 1));
		const childOrigin = this.originForChildrenOf(childAncestry, origin, rect.extent);
		const map = new Widget_MapRect(direction, rect, childOrigin, childAncestry, ancestry);
		this.childHeight = childHeight;
		this.widgetMapRects.push(map);
	}

	originForChildrenOf(childAncestry: Ancestry, origin: Point, extent: Point): Point {
		const child = childAncestry.thing;
		let x, y = 0;
		if (child) {
			y = extent.y - childAncestry.visibleProgeny_halfHeight - 0.5;
			x = origin.x + child.titleWidth + k.dot_size + k.line_stretch + 4.5;
		}
		return new Point(x, y);
	}

	getDirection(delta: number) {
		if (delta > 1) {
			return IDLine.down;
		} else if (delta < -1) {
			return IDLine.up;
		} else {
			return IDLine.flat;
		}
	}
}