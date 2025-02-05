import { k, u, ux, Rect, Thing, Point, Angle, Ancestry, T_Element, S_Element } from '../common/Global_Imports'

export default class G_Widget extends Rect {
	parent_ancestry: Ancestry | null;
	widget_ancestry: Ancestry | null;
	child_angle: number | null;
	s_element: S_Element;
	points_toChild = true;
	points_right = true;
	child: Thing | null;
	children_origin: Point;
	curveType: string;

	constructor(curveType: string, rect: Rect, children_origin: Point, widget_ancestry: Ancestry | null,
		parent_ancestry: Ancestry | null, points_toChild: boolean = true, child_angle: number | null = null) {
		super(u.copyObject(rect.origin), u.copyObject(rect.size));
		this.s_element = ux.s_element_for(widget_ancestry, T_Element.widget, k.empty);
		this.points_right = !child_angle ? true : new Angle(child_angle).angle_pointsRight;
		this.child = widget_ancestry?.thing ?? null;
		this.parent_ancestry = parent_ancestry;
		this.widget_ancestry = widget_ancestry;
		this.points_toChild = points_toChild;
		this.children_origin = children_origin;
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

	get responder(): HTMLElement | null { return this.s_element.responder; }

}
