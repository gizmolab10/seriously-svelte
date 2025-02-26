import { g, k, u, ux, Rect, Point, Angle, Ancestry, T_Element, S_Element } from '../common/Global_Imports'

export default class G_Widget extends Rect {
	ancestry_parent: Ancestry | null;
	ancestry_widget: Ancestry | null;
	child_angle: number | null;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofChild = Point.zero;
	origin_ofTitle = Point.zero;
	origin_ofTree = Point.zero;
	center_ofDrag = Point.zero;
	points_toChild = true;
	es_widget: S_Element;
	points_right = true;
	curveType: string;
	width_ofWidget = 0;

	get responder(): HTMLElement | null { return this.es_widget.responder; }

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
		origin_ofChild: Point,
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
		this.origin_ofChild = origin_ofChild;
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
		const x_radial = this.points_right ? -4 : -k.dot_size * 3.5;
		const offset_ofRadial = new Point(x_radial, 4 - k.dot_size);
		const offset_ofWidget = new Point(17, (k.dot_size / -15) - 7);
		const showingReveal = this.ancestry_widget?.showsReveal_forPointingToChild(this.points_toChild) ?? false;
		this.origin_ofRadial = this.origin_ofChild.offsetBy(offset_ofRadial);
		this.origin_ofTitle = new Point(g.inRadialMode ? (this.points_right ? 18 : (showingReveal ? 4.5 : -3)) : 15.5, 2);
		this.origin_ofTree = this.extent.offsetBy(offset_ofWidget);
		if (!!this.ancestry_widget?.thing) {
			const multiplier = showingReveal ? 2 : 1.35;
			const width_ofTitle = this.ancestry_widget.thing.titleWidth;
			const adjustment_forRadial = !g.inRadialMode ? -20 : (this.points_right ? 3 : -8);
			const width_ofExtra = (k.dot_size * multiplier) + adjustment_forRadial;
			this.width_ofWidget = width_ofTitle + width_ofExtra + 5;
			const x_drag = this.points_right ? (g.inRadialMode ? 3 : 2) : (this.width_ofWidget + (showingReveal ? -2.5 : -2));
			const y_drag = g.inRadialMode ? 2.8 : 2.7;
			this.center_ofDrag = new Point(x_drag, y_drag).offsetEquallyBy(k.dot_size / 2);
		}
		if (showingReveal) {
			const y_reveal = k.dot_size * 0.22;
			const x_reveal = (!this.points_right ? 3 : this.width_ofWidget + k.dot_size - (g.inRadialMode ? 27 : 6));
			this.center_ofReveal = new Point(x_reveal, y_reveal).offsetEquallyBy(k.dot_size / 2);
		}
	}
	
}
