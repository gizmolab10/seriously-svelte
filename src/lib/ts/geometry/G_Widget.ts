import { g, k, u, ux, Rect, Point, Angle, Ancestry, T_Element, S_Element } from '../common/Global_Imports'

export default class G_Widget extends Rect {
	ancestry_ofWidget: Ancestry | null;
	ancestry_ofParent: Ancestry | null;
	angle_ofChild: number | null;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofChild = Point.zero;
	origin_ofTitle = Point.zero;
	origin_ofTree = Point.zero;
	center_ofDrag = Point.zero;
	points_toChild = true;
	es_widget: S_Element;
	offset = Point.zero;
	points_right = true;
	width_ofWidget = 0;
	curveType: string;

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
		ancestry_ofWidget: Ancestry,
		ancestry_ofParent: Ancestry | null,
		points_toChild: boolean = true,
		angle_ofChild: number | null = null) {
		super(u.copyObject(rect.origin), u.copyObject(rect.size));
		this.points_right = !angle_ofChild ? true : new Angle(angle_ofChild).angle_pointsRight;
		this.es_widget = ux.s_element_for(ancestry_ofWidget, T_Element.widget, k.empty);
		this.ancestry_ofParent = ancestry_ofParent;
		this.ancestry_ofWidget = ancestry_ofWidget;
		this.points_toChild = points_toChild;
		this.origin_ofChild = origin_ofChild;
		this.angle_ofChild = angle_ofChild;
		this.curveType = curveType;
		if (!ancestry_ofWidget?.thing) {
			console.log(`geometry G_Widget ... relationship has no child ${ancestry_ofWidget?.relationship?.description}`);
		}
		this.layout();
	}

	destroy() {
		this.ancestry_ofWidget = null;
		this.ancestry_ofParent = null;
	}

	layout() {
		const ancestry = this.ancestry_ofWidget;
		const showingReveal = ancestry?.showsReveal_forPointingToChild(this.points_toChild) ?? false;
		const showingBorder = !ancestry ? false : ancestry.isGrabbed || ancestry.isEditing;
		const adjustment_forBorder = showingBorder ? 0 : 1;
		const x_radial = this.points_right ? -4 : -k.dot_size * 3.5;
		const offset_ofRadial = new Point(x_radial, 4 - k.dot_size);
		const offset_ofWidget = new Point(17, (k.dot_size / -15) - 7);
		const offset_ofTitle_forRadial = (this.points_right ? 15 : (showingReveal ? 14 : 6));
		this.origin_ofTitle = new Point(g.inRadialMode ? offset_ofTitle_forRadial : 12.5, 0);
		this.origin_ofRadial = this.origin_ofChild.offsetBy(offset_ofRadial);
		this.origin_ofTree = this.extent.offsetBy(offset_ofWidget);
		if (!!this.ancestry_ofWidget?.thing) {
			const multiplier = showingReveal ? 2 : 1.35;
			const width_ofTitle = this.ancestry_ofWidget.thing.titleWidth;
			const adjustment_forRadial = !g.inRadialMode ? -20 : (this.points_right ? 3 : -8);
			const width_ofExtra = (k.dot_size * multiplier) + adjustment_forRadial;
			this.width_ofWidget = width_ofTitle + width_ofExtra + 5;
			const offset_forPointingLeft = 44.5 - (this.width_ofWidget + (showingReveal ? 10 : 0));
			const x_offset = adjustment_forBorder + (this.points_right ? -7 : offset_forPointingLeft);
			const x_drag = this.points_right ? (g.inRadialMode ? 3 : 2) : (this.width_ofWidget + (showingReveal ? -2.5 : -2));
			const y_drag = g.inRadialMode ? 2.8 : 2.7;
			this.offset = new Point(x_offset, adjustment_forBorder);
			this.center_ofDrag = new Point(x_drag, y_drag).offsetEquallyBy(k.dot_size / 2);
		}
		if (showingReveal) {
			const y_reveal = k.dot_size * 0.22;
			const x_reveal = (!this.points_right ? 3 : this.width_ofWidget + k.dot_size - (g.inRadialMode ? 27 : 6));
			this.center_ofReveal = new Point(x_reveal, y_reveal).offsetEquallyBy(k.dot_size / 2);
		}
	}
	
}
