import { g, k, u, ux, Rect, Point, Angle, Ancestry, T_Element, S_Element } from '../common/Global_Imports'

export default class G_Widget extends Rect {
	parent_ancestry: Ancestry | null;
	widget_ancestry: Ancestry | null;
	child_angle: number | null;
	points_toChild = true;
	es_widget: S_Element;
	points_right = true;
	child_origin: Point;
	curveType: string;

	// single source of truth for widget's
	//
	// width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// location of child tree
	// radial origin, angles and orientations (in/out, right/left)

	constructor(
		curveType: string,
		rect: Rect,
		child_origin: Point,
		widget_ancestry: Ancestry,
		parent_ancestry: Ancestry | null,
		points_toChild: boolean = true,
		child_angle: number | null = null) {
		super(u.copyObject(rect.origin), u.copyObject(rect.size));
		this.points_right = !child_angle ? true : new Angle(child_angle).angle_pointsRight;
		this.es_widget = ux.s_element_for(widget_ancestry, T_Element.widget, k.empty);
		this.parent_ancestry = parent_ancestry;
		this.widget_ancestry = widget_ancestry;
		this.points_toChild = points_toChild;
		this.child_origin = child_origin;
		this.child_angle = child_angle;
		this.curveType = curveType;
		if (!widget_ancestry?.thing) {
			console.log(`geometry G_Widget ... relationship has no child ${widget_ancestry?.relationship?.description}`);
		}
	}

	destroy() {
		this.parent_ancestry = null;
		this.widget_ancestry = null;
	}

	get responder(): HTMLElement | null { return this.es_widget.responder; }

	get radial_origin(): Point {
		const x = this.points_right ? -4 : -k.dot_size * 3;
		const offset = new Point(x, 4 - k.dot_size);
		return this.child_origin.offsetBy(offset);
	}

	get widget_width(): number {
		let width = 0
		if (!!this.widget_ancestry?.thing) {
			const titleWidth = this.widget_ancestry.thing.titleWidth;
			const multiplier = this.widget_ancestry.showsReveal ? 2 : 1.35;
			const clustersAdjustment = !g.inRadialMode ? -20 : (this.points_right ? 14 : 0);
			const extraWidth = (k.dot_size * multiplier) + clustersAdjustment;
			width = titleWidth + extraWidth + 5;
		}
		return width;
	}

}
