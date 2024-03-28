import { k, get, Path, Rect, Size, Point, ChildMapRect, IDLine } from '../common/GlobalImports';
import { s_layout_asCircles } from '../common/State';

export default class Layout {
	childMapRectArray: Array<ChildMapRect> = [];

	constructor(path: Path, origin: Point) {
		const childPaths = path.childPaths;
		const length = childPaths.length;
		let index = 0;
		if (get(s_layout_asCircles)) {
			const radius = k.circle_necklace_radius;
			const angleIncrement = k.circle_angle_increment;
			const angleStart = (length - 1) * angleIncrement / -2
			const radial = new Point(radius, 0);
			while (index < length) {
				const childPath = childPaths[index];
				const angle = angleStart + angleIncrement * index;
				const circumfralPoint = radial.rotateBy(angle);
				const childOrigin = origin.offsetBy(circumfralPoint);
				const childMapRect = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, childPath, path);
				this.childMapRectArray.push(childMapRect);
				index += 1;
			}
		} else {
			let sumOfSiblingsAbove = -path.visibleProgeny_height() / 2; // start out negative and grow positive
			const sizeX = k.line_stretch;
			while (index < length) {
				const childPath = childPaths[index];
				const childHeight = childPath.visibleProgeny_height();
				const sizeY = sumOfSiblingsAbove + childHeight / 2;
				const rect = new Rect(origin, new Size(sizeX, sizeY));
				const childOrigin = this.originForChildrenOf(childPath, origin, rect.extent);
				const direction = this.getDirection(sizeY);
				const childMapRect = new ChildMapRect(direction, rect, childOrigin, childPath, path);
				this.childMapRectArray.push(childMapRect);
				sumOfSiblingsAbove += childHeight;
				index += 1;
			}
		}
	}

	originForChildrenOf(childPath: Path, origin: Point, extent: Point): Point {
		const child = childPath.thing;
		let x, y = 0;
		if (child) {
			y = extent.y - childPath.visibleProgeny_halfHeight + 0.5;
			x = origin.x + child.titleWidth + k.dot_size + k.line_stretch - 1;
		} else {
			console.log('LAYOUT originForChildrenOf null childPath.thing');
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