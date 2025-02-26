import { g, k, u, ux, Rect, Point, Angle, Ancestry, T_Element, S_Element } from '../common/Global_Imports'

export default class G_Widget extends Rect {
	ancestry_parent: Ancestry | null;
	ancestry_widget: Ancestry | null;
	child_angle: number | null;
	center_reveal = Point.zero;
	origin_radial = Point.zero;
	origin_widget = Point.zero;
	origin_child = Point.zero;
	origin_title = Point.zero;
	center_drag = Point.zero;
	points_toChild = true;
	es_widget: S_Element;
	points_right = true;
	curveType: string;
	widget_width = 0;

	// single source of truth for widget's
	//
	// width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// location of dots, title
	//  child tree
	//  radial origin, angles and orientations (in/out, right/left)

	constructor(
		curveType: string,
		rect: Rect,
		origin_child: Point,
		ancestry_widget: Ancestry,
		ancestry_parent: Ancestry | null,
		points_toChild: boolean = true,
		child_angle: number | null = null) {
		super(u.copyObject(rect.origin), u.copyObject(rect.size));
		this.points_right = !child_angle ? true : new Angle(child_angle).angle_pointsRight;
		this.es_widget = ux.s_element_for(ancestry_widget, T_Element.widget, k.empty);
		this.ancestry_parent = ancestry_parent;
		this.ancestry_widget = ancestry_widget;
		this.points_toChild = points_toChild;
		this.origin_child = origin_child;
		this.child_angle = child_angle;
		this.curveType = curveType;
		if (!ancestry_widget?.thing) {
			console.log(`geometry G_Widget ... relationship has no child ${ancestry_widget?.relationship?.description}`);
		}
		this.layout();
	}

	destroy() {
		this.ancestry_parent = null;
		this.ancestry_widget = null;
	}

	layout() {
		const x_radial = this.points_right ? -4 : -k.dot_size * 3;
		const offset_radial = new Point(x_radial, 4 - k.dot_size);
		const widgetOffset = new Point(17, (k.dot_size / -15) - 7);
		const showingReveal = this.ancestry_widget?.showsReveal ?? false;
		this.origin_radial = this.origin_child.offsetBy(offset_radial);
		this.origin_title = new Point(g.inRadialMode ? 18 : 15.5, 2);
		this.origin_widget = this.extent.offsetBy(widgetOffset);
		if (!!this.ancestry_widget?.thing) {
			const titleWidth = this.ancestry_widget.thing.titleWidth;
			const multiplier = this.ancestry_widget.showsReveal ? 2 : 1.35;
			const clustersAdjustment = !g.inRadialMode ? -20 : (this.points_right ? 3 : -14);
			const extraWidth = (k.dot_size * multiplier) + clustersAdjustment;
			this.widget_width = titleWidth + extraWidth + 5;
			const dragOffsetX = this.points_right ? (g.inRadialMode ? 3 : 2) : (this.widget_width + (showingReveal ? 22.5 : 14)) - 20;
			const dragOffsetY = g.inRadialMode ? 2.8 : 2.7;
			this.center_drag = Point.square(k.dot_size / 2).offsetByXY(dragOffsetX, dragOffsetY);
		}
		if (showingReveal) {
			const revealY = k.dot_size * 0.72;
			const revealX = (!this.points_right ? (g.inRadialMode ? 21 : 9) : this.widget_width + k.dot_size - (g.inRadialMode ? 21 : 0));
			this.center_reveal = new Point(revealX, revealY);
		}
	}

	get responder(): HTMLElement | null { return this.es_widget.responder; }
	
}
