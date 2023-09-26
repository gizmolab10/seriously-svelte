import { get, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { lineGap, lineStretch } from '../managers/State'

export default class Layout {
	lineRects(thing: Thing, childrenHeight: number, origin: Point): Array<LineRect> {
		let rects = Array<LineRect>();
		const quantity = thing.children.length;
		if (quantity > 0) {
			const gapY = get(lineGap);
			const half = quantity / 2;
			const offsetX = get(lineStretch);
			const threshold = Math.floor(half);
			const hasAFlat = threshold != half; // true if 'quantity' is odd
			let offsetY = gapY - childrenHeight / 2;
			let index = 0;
			while (index < quantity) {
				const direction = this.getDirection(threshold - index, hasAFlat);
				const childrenSize = this.adjustSizeFor(thing.children[index].childrenSize, direction, hasAFlat);
				const isFlat = direction == LineCurveType.flat;
				const isUp = direction == LineCurveType.up;
				const childHeight = isFlat ? 0 : childrenSize.height * (isUp ? -1 : 1);
				const size = new Size(offsetX, offsetY);
				const rect = new Rect(new Point(0, origin.y), size);
				
				// console.log('LAYOUT line end y:', offsetY, 'childHeight:', childHeight, direction, index);
				
				offsetY += Math.max(childrenSize.height, gapY);
				rects.push(new LineRect(direction, rect));
				index += 1;
			}
		}
		return rects;
	}

	adjustSizeFor(size: Size, direction: LineCurveType, hasAFlat: boolean) {
		const gap = get(lineGap) / 2;
		let height = 0
		if (!hasAFlat) {
			switch (direction) {
				case LineCurveType.down: height =  gap;
				case LineCurveType.up:   height = -gap;
			}
		}
		return size.expandedBy(new Size(0, height));
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

	get drawnSize(): Size {
		return new Size();
	}
}