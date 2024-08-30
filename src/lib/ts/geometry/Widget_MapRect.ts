import { k, ux, Rect, Thing, Point, Angle, Ancestry, ElementType, Element_State } from '../common/Global_Imports'

export default class Widget_MapRect extends Rect {
	parentAncestry: Ancestry | null;
	childAncestry: Ancestry | null;
	element_state: Element_State;
	childAngle: number | null;
	points_right = true;
	child: Thing | null;
	childOrigin: Point;
	subtype = k.empty;
	curveType: string;

	constructor(curveType: string, rect: Rect, childOrigin: Point, childAncestry: Ancestry | null,
		parentAncestry: Ancestry | null, childAngle: number | null = null, subtype: string = k.empty) {
		super(rect.origin.copy, rect.size.copy);
		this.element_state = ux.elementState_for(childAncestry, ElementType.widget, subtype);
		this.points_right = !childAngle ? true : new Angle(childAngle).angle_pointsRight;
		this.child = childAncestry?.thing ?? null;
		this.parentAncestry = parentAncestry;
		this.childAncestry = childAncestry;
		this.childOrigin = childOrigin;
		this.childAngle = childAngle;
		this.curveType = curveType;
		this.subtype = subtype;
		if (!this.child) {
			console.log('geometry Widget_MapRect ... has no child');
		}
	}

	destroy() {
		this.parentAncestry = null;
		this.childAncestry = null;
	}
}
