import { k, Rect, Size, Point, T_Curve, Ancestry, G_Widget } from '../common/Global_Imports';

export default class G_TreeChild {
	progeny_height = 0;

	// scratchpad for
	//  computing progeny height and widget origin
	//  creating single source of truth for g_widget

	constructor(
		sum: number,
		origin: Point,
		ancestry: Ancestry) {
		const progeny_height = ancestry.visibleProgeny_height();
		const child_sizeY = sum + progeny_height / 2;
		const t_childCurve = this.get_t_childCurve(child_sizeY);
		const child_rect = new Rect(origin, new Size(k.line_stretch, child_sizeY - 1));
		const child_widget_origin = this.origin_forAncestry_inRect(ancestry, child_rect);
		ancestry.g_widget.update(child_widget_origin, 0, true, child_rect, t_childCurve);
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

	get_t_childCurve(delta: number): string {
		if (delta > 1) {
			return T_Curve.down;
		} else if (delta < -1) {
			return T_Curve.up;
		} else {
			return T_Curve.flat;
		}
	}

}