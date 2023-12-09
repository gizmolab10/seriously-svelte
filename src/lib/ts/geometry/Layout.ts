import { Thing, LineRect, LineCurveType } from '../common/GlobalImports';

export default class Layout {
	lineRects: Array<LineRect>;

	constructor(thing: Thing) {
		this.lineRects = [];
		if (thing) {
			const origin = thing.visibleProgeny_halfHeight;
			const children = thing.children;
			const quantity = children.length;
			if (quantity < 2 || !thing.isExpanded) {
				this.lineRects.push(new LineRect(LineCurveType.flat, origin));
			} else {
				let index = 0;
				let sumOfSiblingsAbove = -thing.visibleProgeny_halfHeight; // start out negative and grow positive
				while (index < quantity) {
					const child = children[index];
					index += 1;
					const sizeY = sumOfSiblingsAbove + child.visibleProgeny_halfHeight;
					sumOfSiblingsAbove += child.visibleProgeny_height;
					const direction = this.getDirection(sizeY);
					this.lineRects.push(new LineRect(direction, origin + sizeY));
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