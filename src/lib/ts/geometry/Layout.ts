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
				const sizeX = get(lineStretch);
				const threshold = Math.floor(half);
				const hasAFlat = threshold != half;
				const childrenHeight = parent.visibleProgenyHeight;
				let sizeY = gapY - (childrenHeight / 2); // start out negative and grow positive
				let index = 0;
				while (index < quantity) {
					const child = children[index];
					const direction = this.getDirection(threshold - index, hasAFlat);
					const adjustY = this.heightAdjustement(direction);
					const childHeight = child.visibleProgenyHeight + adjustY;
					if ((child.children.length > 1) && child.isExpanded) {
						sizeY += childHeight / 2;
					}
					const rect = new Rect(origin, new Size(sizeX, sizeY));
					
					console.log('LAYOUT x:', origin.x, ' y:', sizeY, 'h:', childHeight, direction, index, child.title);
					
					sizeY += Math.max(childHeight, gapY);
					this.lineRects.push(new LineRect(direction, rect));
					index += 1;
				}

				console.log('LINES h:', childrenHeight, parent.isExpanded ? 'expanded:' : 'collapsed:', parent.title);
			}
		}
	}

	heightAdjustement(direction: LineCurveType) {
		const halfGap = get(lineGap) / 2;
		return (direction == LineCurveType.down) ? halfGap : (direction == LineCurveType.up) ? -halfGap : 0;
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