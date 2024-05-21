import { Rect, Thing, Point, Ancestry } from '../common/GlobalImports'

export default class ChildMapRect extends Rect {
	childAncestry: Ancestry | null;
	childAngle: number | null;
	ancestry: Ancestry | null;
	child: Thing | null;
	childOrigin: Point;
	curveType: string;

	constructor(curveType: string, rect: Rect, childOrigin: Point, childAncestry: Ancestry | null, ancestry: Ancestry | null, childAngle: number | null = null) {
		super(rect.origin.copy, rect.size.copy);
		this.child = childAncestry?.thing ?? null;
		this.childOrigin = childOrigin;
		this.childAngle = childAngle;
		this.childAncestry = childAncestry;
		this.curveType = curveType;
		this.ancestry = ancestry;
		if (!this.child) {
			console.log('Geometry ChildMapRect ... has no child');
		}
	}

	destroy() {
		this.ancestry = null;
		this.childAncestry = null;
	}
}
