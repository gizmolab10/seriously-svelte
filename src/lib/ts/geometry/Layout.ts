import { get, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { lineGap, lineStretch } from '../managers/State'

export default class Layout {
	lineRects: Array<LineRect>;

    constructor(here: Thing, origin: Point) {
        this.lineRects = [];
		if (here) {
			const children = here.children;
			const quantity = children.length;
			if (quantity > 0) {
				const half = quantity / 2;
				const gapY = get(lineGap);
				const sizeX = get(lineStretch);
				const threshold = Math.floor(half);
				const hasAFlat = threshold != half;
				const childrenHeight = here.childrenHeight;
				const halfChildrenHeight = childrenHeight / 2;
				let sizeY = gapY - halfChildrenHeight;
				let index = 0;
				while (index < quantity) {
					const child = children[index];
					const direction = this.getDirection(threshold - index, hasAFlat);
					const chilHeight = this.adjustSizeFor(child.childrenSize.height, direction, hasAFlat);
					const rect = new Rect(origin, new Size(sizeX, sizeY));
					
					// console.log('LAYOUT x:', origin.x, ' y:', sizeY, direction, index, child.title);
					
					sizeY += Math.max(chilHeight, gapY);
					this.lineRects.push(new LineRect(direction, rect));
					index += 1;
				}
			}

			// console.log('LINES height:', height, here.isExpanded ? 'expanded:' :  'collapsed:', here.title);
		}
	}

	adjustSizeFor(height: number, direction: LineCurveType, hasAFlat: boolean) {
		const halfGap = get(lineGap) / 2;
		const offsetY = (direction == LineCurveType.down) ? halfGap : (direction == LineCurveType.up) ? -halfGap : 0;
		return offsetY + height;
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