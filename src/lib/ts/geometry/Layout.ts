import { get, Path, Rect, Size, Point, Thing, LineRect, LineCurveType } from '../common/GlobalImports';
import { s_line_stretch } from '../managers/State'

export default class Layout {
	lineRects: Array<LineRect>;

	constructor(thing: Thing, path: Path, origin: Point) {
		this.lineRects = [];
		if (thing) {
			const sizeX = get(s_line_stretch);
			const children = thing.children;
			const length = children.length;
			if (length < 2 || !path.isExpanded) {
				const rect = new Rect(origin, new Size(sizeX, 0));
				this.lineRects.push(new LineRect(LineCurveType.flat, rect));
			} else {
				let index = 0;
				let sumOfSiblingsAbove = -path.visibleProgeny_height / 2; // start out negative and grow positive
				while (index < length) {
					const child = children[index];
					const childPath = path.appendingThing(child);
					const childHeight = childPath.visibleProgeny_height;
					const sizeY = sumOfSiblingsAbove + childHeight / 2;
					const direction = this.getDirection(sizeY);
					const rect = new Rect(origin, new Size(sizeX, sizeY));
					this.lineRects.push(new LineRect(direction, rect));
					sumOfSiblingsAbove += childHeight;
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