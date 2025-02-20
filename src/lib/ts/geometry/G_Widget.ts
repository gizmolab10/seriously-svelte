import { g, k, u, ux, Rect, Thing, Point, Angle, Ancestry, T_Element, S_Element } from '../common/Global_Imports'

export default class G_Widget extends Rect {
	parent_ancestry: Ancestry | null;
	widget_ancestry: Ancestry | null;
	child_angle: number | null;
	children_origin: Point;
	points_toChild = true;
	es_widget: S_Element;
	points_right = true;
	child: Thing | null;
	curveType: string;
	widget_width = 0;

	constructor(curveType: string, rect: Rect, children_origin: Point, widget_ancestry: Ancestry,
		parent_ancestry: Ancestry | null, points_toChild: boolean = true, child_angle: number | null = null) {
		super(u.copyObject(rect.origin), u.copyObject(rect.size));
		this.es_widget = ux.s_element_for(widget_ancestry, T_Element.widget, k.empty);
		this.points_right = !child_angle ? true : new Angle(child_angle).angle_pointsRight;
		this.child = widget_ancestry?.thing ?? null;
		this.parent_ancestry = parent_ancestry;
		this.widget_ancestry = widget_ancestry;
		this.children_origin = children_origin;
		this.points_toChild = points_toChild;
		this.widget_width = this.getWidth;
		this.child_angle = child_angle;
		this.curveType = curveType;
		if (!this.child) {
			console.log(`geometry G_Widget ... relationship has no child ${widget_ancestry?.relationship?.description}`);
		}
	}

	destroy() {
		this.parent_ancestry = null;
		this.widget_ancestry = null;
	}

	get responder(): HTMLElement | null { return this.es_widget.responder; }

	get getWidth(): number {
		let width = 0
		if (!!this.widget_ancestry?.thing) {
			const titleWidth = this.widget_ancestry.thing.titleWidth;
			const multiplier = this.widget_ancestry.showsReveal ? 2 : 1.35;
			const clustersAdjustment = g.inRadialMode ? (this.points_right ? 14 : 0) : -17;
			const extraWidth = (k.dot_size * multiplier) + clustersAdjustment;
			width = titleWidth + extraWidth;
		}
		return width;
	}

}
