import { get, Path, Rect, Size, Point, ChildMap, IDLine } from '../common/GlobalImports';
import { s_dot_size, s_line_stretch } from '../managers/State'

export default class Layout {
	childMapArray: Array<ChildMap> = [];

	constructor(path: Path, origin: Point) {
		const sizeX = get(s_line_stretch);
		const childPaths = path.childPaths;
		const length = childPaths.length;
		let index = 0;
		let sumOfSiblingsAbove = -path.visibleProgeny_height() / 2; // start out negative and grow positive
		while (index < length) {
			const childPath = childPaths[index];
			const childHeight = childPath.visibleProgeny_height();
			const sizeY = sumOfSiblingsAbove + childHeight / 2;
			const rect = new Rect(origin, new Size(sizeX, sizeY));
			const childOrigin = this.originForChildrenOf(childPath, origin, rect.extent);
			const direction = this.getDirection(sizeY);
			const childMap = new ChildMap(direction, rect, childOrigin, childPath, path);
			this.childMapArray.push(childMap);
			sumOfSiblingsAbove += childHeight;
			index += 1;
		}
	}

	originForChildrenOf(childPath: Path, origin: Point, extent: Point): Point {
		const child = childPath.thing;
		let x, y = 0;
		if (child) {
			y = extent.y - childPath.visibleProgeny_halfHeight;
			x = origin.x + child.titleWidth + get(s_dot_size) + get(s_line_stretch) - 2;
		} else {
			alert('grandchildren origin not computable');
		}
		return new Point(x, y);
	}

	getDirection(delta: number) {
		if (delta == 0) {
			return IDLine.flat;
		} else if (delta <
			 0) {
			return IDLine.up;
		} else {
			return IDLine.down;
		}
	}
}