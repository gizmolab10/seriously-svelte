import { k, Rect, Size, Point, T_Line, Ancestry, G_Widget } from '../common/Global_Imports';

export default class G_Children {
	g_widgets: Array<G_Widget> = [];
	childHeight = 0;

	constructor(sum: number, parent_ancestry: Ancestry, child_ancestry: Ancestry, origin: Point) {
		const childHeight = child_ancestry.visibleProgeny_height();
		const sizeY = sum + childHeight / 2;
		const direction = this.getDirection(sizeY);
		const rect = new Rect(origin, new Size(k.line_stretch, sizeY - 1));
		const child_origin = this.originForChildrenOf(child_ancestry, rect);
		const g_widget = new G_Widget(direction, rect, child_origin, child_ancestry, parent_ancestry);
		this.childHeight = childHeight;
		this.g_widgets.push(g_widget);
	}

	originForChildrenOf(childAncestry: Ancestry, rect: Rect): Point {
		const child = childAncestry.thing;
		let x, y = 0;
		if (!!child) {
			y = rect.extent.y - childAncestry.visibleProgeny_halfHeight;
			x = rect.origin.x + child.titleWidth + k.dot_size + k.line_stretch + 4.5;
		}
		return new Point(x, y);
	}

	getDirection(delta: number) {
		if (delta > 1) {
			return T_Line.down;
		} else if (delta < -1) {
			return T_Line.up;
		} else {
			return T_Line.flat;
		}
	}
}