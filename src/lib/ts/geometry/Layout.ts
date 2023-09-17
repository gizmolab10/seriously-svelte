import { get, Rect, Size, Point, Thing, constants, LineRect, LineCurveType } from '../common/GlobalImports';
import { widgetGap, lineStretch } from '../managers/State'

export default class Layout {
	origin = new Point();
	widgetGap: number;
	thing: Thing;

	constructor(thing: Thing, origin: Point) {
		this.origin = origin;
		this.thing = thing;
		this.widgetGap = get(widgetGap);
	}

	get lineRects(): Array<LineRect> {
		let rects = Array<LineRect>();
		const quantity = this.thing.children.length;
		if (quantity > 0) {
			const half = quantity / 2;
			const threshold = Math.floor(half);
			const hasAFlat = threshold != half; // true only if 'quantity' is odd
			let origin = this.origin;
			let index = 0;
			while (index < quantity) {
				const delta = index - half + 0.5;
				const direction = this.getDirection(threshold - index, hasAFlat);
				const lineOrigin = origin.copy;
				let height = this.widgetGap * delta;
				switch (direction) {
					case LineCurveType.flat:
						height = 0;
						break;
					case LineCurveType.up:
						height = this.widgetGap * delta;
						break;
				}
				lineOrigin.y += this.widgetGap;
				const size = new Size(get(lineStretch), height);
				const rect = new Rect(lineOrigin, size);

				// console.log('LAYOUT PUSH:', rect.description, direction, index);

				rects.push(new LineRect(direction, rect));
				index += 1;
			}
		}
		return rects;
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