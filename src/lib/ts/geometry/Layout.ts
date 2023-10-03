import {noop} from 'svelte/internal';
import { get, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { lineGap, lineStretch } from '../managers/State'

export default class Layout {
	lineRects: Array<LineRect>;

    constructor(parent: Thing, origin: Point) {
        this.lineRects = [];
		if (parent) {
			const children = parent.children;
			const quantity = children.length;
			if (quantity > 0) {
				const half = quantity / 2;
				const gapY = get(lineGap);
				const halfGapY = gapY / 2;
				const sizeX = get(lineStretch);
				const threshold = Math.floor(half);
				const hasAFlat = threshold != half;
				const visibleProgenyHeight = parent.visibleProgenyHeight;
				const initialSizeY = (gapY - visibleProgenyHeight) / 2; // start out negative and grow positive

				let index = 0;
				let sumOfSiblingsAbove = 0;
				while (index < quantity) {
					const child = children[index];
					const direction = this.getDirection(threshold - index, hasAFlat);
					const childHalfVisibleProgenyHeight = child.halfVisibleProgenyHeight;
					const sizeY = initialSizeY + sumOfSiblingsAbove + childHalfVisibleProgenyHeight;
					const rect = new Rect(origin, new Size(sizeX, sizeY - halfGapY));
					
					// console.log('LINE r.e.y:', rect.extent.y, ' o.y:', origin.y, ' s.y:', sizeY, 'h:', childHalfVisibleProgenyHeight, direction, index, child.title);
					
					sumOfSiblingsAbove += child.visibleProgenyHeight;
					this.lineRects.push(new LineRect(direction, rect));
					index += 1;
				}

				// console.log('LAYOUT', origin.x, parent.title);
			}
		}
	}

	getDirection(delta: number, isFlat: Boolean) {
		if (delta == 0 && isFlat) {
			return LineCurveType.flat;
		} else if (delta > 0) {
			return LineCurveType.up;
		} else {
			return LineCurveType.down;
		}
	}
}