import { k, s, Rect, Thing, Point, Ancestry, ElementType, ElementState } from '../common/GlobalImports'

export default class ChildMapRect extends Rect {
	childAncestry: Ancestry | null;
	elementState: ElementState;
	childAngle: number | null;
	ancestry: Ancestry | null;
	subtype = k.empty;
	child: Thing | null;
	childOrigin: Point;
	curveType: string;

	constructor(curveType: string, rect: Rect, childOrigin: Point, childAncestry: Ancestry | null,
		ancestry: Ancestry | null, childAngle: number | null = null, subtype: string = k.empty) {
		super(rect.origin.copy, rect.size.copy);
		this.elementState = s.elementState_for(childAncestry, ElementType.widget, subtype);
		this.child = childAncestry?.thing ?? null;
		this.childAncestry = childAncestry;
		this.childOrigin = childOrigin;
		this.childAngle = childAngle;
		this.curveType = curveType;
		this.ancestry = ancestry;
		this.subtype = subtype;
		if (!this.child) {
			console.log('geometry ChildMapRect ... has no child');
		}
	}

	destroy() {
		this.ancestry = null;
		this.childAncestry = null;
	}
}
