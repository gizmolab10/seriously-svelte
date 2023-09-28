import { get, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { lineGap, lineStretch } from '../managers/State'

export default class Layout {
	lineRects: Array<LineRect>;
	origin: Point;
	here: Thing;

    constructor(here: Thing, defaultOrigin: Point) {
	    this.origin = defaultOrigin;
        this.lineRects = [];
        this.here = here;
		if (this.here) {
			const childrenHeight = this.here.childrenHeight;
			const halfChildrenHeight = childrenHeight / 2;
			const children = this.here.children;
			const quantity = children.length;
			// the following uses the above values
			if (quantity > 0) {
				const gapY = get(lineGap);
				const half = quantity / 2;
				const sizeX = get(lineStretch);
				const threshold = Math.floor(half);
				const hasAFlat = threshold != half;					// true if 'quantity' is odd
				const commonOrigin = new Point(0, this.origin.y);	// TODO: assumes 'left' assigned by Children component ???
				let sizeY = gapY - halfChildrenHeight;
				let index = 0;
				while (index < quantity) {
					const direction = this.getDirection(threshold - index, hasAFlat);
					const childrenHeight = this.adjustSizeFor(children[index].childrenSize.height, direction, hasAFlat);
					const rect = new Rect(commonOrigin, new Size(sizeX, sizeY));
					
					// const isFlat = direction == LineCurveType.flat;
					// const isUp = direction == LineCurveType.up;
					// const childHeight = isFlat ? 0 : childrenSize.height * (isUp ? -1 : 1);
					// console.log('LAYOUT line end y:', sizeY, 'childHeight:', childHeight, direction, index);
					
					sizeY += Math.max(childrenHeight, gapY);
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