import { get, Rect, Size, Point, Thing, DebugOption, LineRect, LineCurveType } from '../common/GlobalImports';
import { lineStretch } from '../managers/State'

export default class Layout {
	lineRects: Array<LineRect>;

	constructor(parent: Thing, origin: Point) {
		this.lineRects = [];
		if (parent) {
			const children = parent.children;
			const quantity = children.length;
			if (quantity > 0) {
				const sizeX = get(lineStretch);
				const initialOffsetY = -parent.halfVisibleProgenyHeight; // start out negative and grow positive

				let index = 0;
				let sumOfSiblingsAbove = 0;
				while (index < quantity) {
					const child = children[index];
					const childHalfVisibleProgenyHeight = child.halfVisibleProgenyHeight;
					const sizeY = childHalfVisibleProgenyHeight + initialOffsetY + sumOfSiblingsAbove;
					const direction = this.getDirection(sizeY);
					const rect = new Rect(origin, new Size(sizeX, sizeY));
					sumOfSiblingsAbove += child.visibleProgenyHeight;
					this.lineRects.push(new LineRect(direction, rect));
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