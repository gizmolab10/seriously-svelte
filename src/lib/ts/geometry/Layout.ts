import { get, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { line_stretch } from '../managers/State'

export default class Layout {
	lineRects: Array<LineRect>;

	constructor(thing: Thing, origin: Point) {
		this.lineRects = [];
		if (thing) {
			const children = thing.children;
			const quantity = children.length;
			const sizeX = get(line_stretch);
			if (quantity < 2 || !thing.isExpanded) {
				const rect = new Rect(origin, new Size(sizeX, 0));
				this.lineRects.push(new LineRect(LineCurveType.flat, rect));
			} else {
				let index = 0;
				let sumOfSiblingsAbove = -thing.visibleProgeny_halfHeight; // start out negative and grow positive
				while (index < quantity) {
					const child = children[index];
					const childvisibleProgeny_halfHeight = child.visibleProgeny_halfHeight;
					const sizeY = sumOfSiblingsAbove + childvisibleProgeny_halfHeight;
					const direction = this.getDirection(sizeY);
					const rect = new Rect(origin, new Size(sizeX, sizeY));
					this.lineRects.push(new LineRect(direction, rect));
					sumOfSiblingsAbove += child.visibleProgeny_height;
					index += 1;
				}
			}
		}
	}

	getDirection(delta: number) {
		if (delta == 0) {
			return LineCurveType.flat;
		} else if (delta <
			 0) {
			return LineCurveType.up;
		} else {
			return LineCurveType.down;
		}
	}
}