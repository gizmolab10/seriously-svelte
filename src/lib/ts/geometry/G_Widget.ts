import { g, k, u, ux, Rect, Point, Angle, debug, Ancestry, T_Element, S_Element } from '../common/Global_Imports'
import { w_hierarchy, w_graph_rect, w_show_details, w_ancestry_focus } from '../managers/Stores';
import { get } from 'svelte/store';

export default class G_Widget extends Rect {
	ancestry_ofWidget: Ancestry | null;
	ancestry_ofParent: Ancestry | null;
	origin_ofFirstReveal = Point.zero;
	angle_ofChild: number | null;
	offset_ofWidget = Point.zero;
	center_ofReveal = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofChild = Point.zero;
	origin_ofFocus = Point.zero;
	origin_ofTitle = Point.zero;
	origin_ofChildrenTree = Point.zero;
	center_ofDrag = Point.zero;
	points_toChild = true;
	es_widget: S_Element;
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

	get showingReveal(): boolean {
		return this.ancestry_ofWidget?.showsReveal_forPointingToChild(this.points_toChild) ?? false;
	}

	get width_ofBothDots(): number {
		const adjustment_forReveal = k.dot_size * (this.showingReveal ? 2 : 1);
		const adjustment_forRadial = !g.inRadialMode ? -13.5 : (this.points_right ? 11 : -0.5);
		return adjustment_forReveal + adjustment_forRadial;
	}

	layout() {
		const ancestry = this.ancestry_ofWidget;
		const showingReveal = this.showingReveal;
		const showingBorder = !ancestry ? false : ancestry.isGrabbed || ancestry.isEditing;
		const adjustment_forBorder = showingBorder ? 0 : 1;
		const x_radial = this.points_right ? 4 : k.dot_size * 3.5;
		const offset_ofRadial = new Point(x_radial, k.dot_size - 4).negated;
		const offset_ofChildrenTree = new Point(k.dot_size * 1.3, -(7 + k.dot_size / 15));
		const offset_ofTitle_forRadial = (this.points_right ? 15 : (showingReveal ? 16 : 3));
		this.origin_ofTitle = new Point(g.inRadialMode ? offset_ofTitle_forRadial : 12.5, 0);
		this.origin_ofRadial = this.origin_ofChild.offsetBy(offset_ofRadial);
		this.origin_ofChildrenTree = this.extent.offsetBy(offset_ofChildrenTree);
		if (!!ancestry?.thing) {
			// debug.log_layout(`G WIDGET for ${ancestry.title}`);
			const width = ancestry.thing.titleWidth + this.width_ofBothDots;
			const adjustment_forDirection = this.points_right ? 7 : width - 34.5;
			const adjustment_x = adjustment_forBorder - adjustment_forDirection;
			const x_drag = this.points_right ? (g.inRadialMode ? 3 : 2) : (width - (showingReveal ? 2.5 : 2));
			const y_drag = g.inRadialMode ? 2.8 : 2.7;
			this.center_ofDrag = new Point(x_drag, y_drag).offsetEquallyBy(k.dot_size / 2);
			this.offset_ofWidget = new Point(adjustment_x, adjustment_forBorder);
			this.width_ofWidget = width;
		}
		if (!g.inRadialMode) {
			const graphRect = get(w_graph_rect);
			const focusAncestry = get(w_ancestry_focus);
			const focus = focusAncestry?.thing ?? get(w_hierarchy).root;
			const childrenSize = focusAncestry?.visibleProgeny_size;
			const offsetX_ofFirstReveal = focus?.titleWidth / 2 - 2;
			const offsetY = -1 - graphRect.origin.y;
			const offsetX = 15 + (get(w_show_details) ? -k.width_details : 0) - (childrenSize.width / 2) - (k.dot_size / 2.5) + offsetX_ofFirstReveal;
			this.origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, offsetY);
			this.origin_ofFocus = this.origin_ofFirstReveal.offsetByXY(-21.5 - offsetX_ofFirstReveal, -5);
		}
		if (showingReveal) {
			const y_reveal = k.dot_size * 0.72;
			const x_reveal = k.dot_size - (!this.points_right ? 3 : (g.inRadialMode ? 21 : 0) - this.width_ofWidget);
			this.center_ofReveal = new Point(x_reveal, y_reveal);
		}
	}
	
}
