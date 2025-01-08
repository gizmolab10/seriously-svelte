import { k, u, ux, Rect, Thing, Point, Angle, Ancestry, ElementType, Element_State } from '../common/Global_Imports'

export default class Widget_MapRect extends Rect {
	parent_ancestry: Ancestry | null;
	widget_ancestry: Ancestry | null;
	element_state: Element_State;
	childAngle: number | null;
	points_right = true;
	child: Thing | null;
	childOrigin: Point;
	subtype = k.empty;
	curveType: string;

	constructor(curveType: string, rect: Rect, childOrigin: Point, widget_ancestry: Ancestry | null,
		parent_ancestry: Ancestry | null, childAngle: number | null = null, subtype: string = k.empty) {
		super(u.copyObject(rect.origin), u.copyObject(rect.size));
		this.element_state = ux.element_state_for(widget_ancestry, ElementType.widget, subtype);
		this.points_right = !childAngle ? true : new Angle(childAngle).angle_pointsRight;
		this.child = widget_ancestry?.thing ?? null;
		this.parent_ancestry = parent_ancestry;
		this.widget_ancestry = widget_ancestry;
		this.childOrigin = childOrigin;
		this.childAngle = childAngle;
		this.curveType = curveType;
		this.subtype = subtype;
		if (!this.child) {
			console.log('geometry Widget_MapRect ... has no child');
		}
	}

	destroy() {
		this.parent_ancestry = null;
		this.widget_ancestry = null;
	}

	get responder(): HTMLElement | null { return this.element_state.responder; }

}
