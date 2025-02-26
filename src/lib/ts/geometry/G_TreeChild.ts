import { k, Rect, Size, Point, T_Line, Ancestry, G_Widget } from '../common/Global_Imports';

export default class G_TreeChild {
	g_widget: G_Widget;
	progeny_height = 0;

	// scratchpad for
	//  computing progeny height and widget origin
	//  creating single source of truth for widget geometry

	constructor(
		sum: number,
		ancestry_ofParent: Ancestry,
		child_ancestry: Ancestry,
		origin: Point) {
		const progeny_height = child_ancestry.visibleProgeny_height();
		const sizeY = sum + progeny_height / 2;
		const direction = this.getDirection(sizeY);
		const rect = new Rect(origin, new Size(k.line_stretch, sizeY - 1));
		const widget_origin = this.origin_forAncestry_inRect(child_ancestry, rect);
		this.g_widget = new G_Widget(direction, rect, widget_origin, child_ancestry, ancestry_ofParent);
		this.progeny_height = progeny_height;
	}

	origin_forAncestry_inRect(childAncestry: Ancestry, rect: Rect): Point {
		const child = childAncestry.thing;
		let x, y = 0;
		if (!!child) {
			y = rect.extent.y - childAncestry.visibleProgeny_halfHeight;
			x = rect.origin.x + child.titleWidth + k.dot_size + k.line_stretch;
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