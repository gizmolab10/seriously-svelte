import { g, k, u, get, Path, Rect, Size, Point, Radians, IDLine, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_byClusters } from '../common/State';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRectArray: Array<ChildMapRect> = [];

	constructor(path: Path, origin: Point) {
		let childPaths = path.childPaths;
		if (get(s_layout_byClusters)) {
			this.layoutCluster(childPaths, path, Predicate.idContains, origin, true);
			for (const predicate of g.hierarchy.predicates) {
				const id = predicate.id;
				const parentPaths = path.uniqueParentPaths_for(id);
				this.layoutCluster(parentPaths, path, id, origin, false);
			}
		} else {
			let index = 0;
			const sizeX = k.line_stretch;
			const length = childPaths.length;
			let sumOfSiblingsAbove = -path.visibleProgeny_height() / 2; // start out negative and grow positive
			while (index < length) {
				const childPath = childPaths[index];
				const childHeight = childPath.visibleProgeny_height();
				const sizeY = sumOfSiblingsAbove + childHeight / 2;
				const direction = this.getDirection(sizeY);
				const rect = new Rect(origin, new Size(sizeX, sizeY));
				const childOrigin = this.originForChildrenOf(childPath, origin, rect.extent);
				const map = new ChildMapRect(direction, rect, childOrigin, childPath, path);
				this.childMapRectArray.push(map);
				sumOfSiblingsAbove += childHeight;
				index += 1;
			}
		}
	}

	layoutCluster(paths: Array<Path>, clusterPath: Path, idPredicate: string, origin: Point, pointsTo: boolean) {
		const count = paths.length;
		if (count > 0) {
			const clusterLayout = new ClusterLayout(idPredicate, count, pointsTo);
			const radius = k.necklace_gap + k.cluster_inside_radius;
			const radial = new Point(radius, 0);
			this.clusterLayouts.push(clusterLayout);
			let index = 0;
			while (index < count) {
				const path = paths[index];
				const clockwise_radians = this.clockwise_radians(index, count, clusterLayout.clockwise_radians, radial, path.title);
				const childOrigin = origin.offsetBy(radial.rotate_clockwiseBy(clockwise_radians));
				const map = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, path, clusterPath, clockwise_radians);
				this.childMapRectArray.push(map);
				index += 1;
			}
		}
	}

	broken_clockwise_radians(index: number, count: number, radians: number, radial: Point, title: string): number {
		const startY = radial.rotate_clockwiseBy(radians).y;			// height of radians
		// const quadrant = u.quadrant_of(radians);						// quadrant of radians
		const row = index - (count / 2);								// row centered around zero
		let y = startY + (row * k.row_height);							// height of row
		if (Math.abs(y) > radial.x) {
			y = radial.x;
		}
		const delta = u.normalized_radians(Math.asin(y / radial.x));	// divide by radius and grab its arc sign
		// const quadrantRadian = u.quadrant_startRadian(radians);		// quadrant of radians
		// depending on the quadrant
		// add or subtract it from radians
		// const clockwise_radians = u.normalized_radians(quadrantRadian + delta);
		const string = u.degrees_of(delta);
		console.log(`index ${index} delta ${string} for \"${title}\"`);
		return -delta;
	}

	clockwise_radians(row: number, count: number, radians: number, radial: Point): number {
		const start_row = (8 - count) / 2;
		const y = (start_row + row) * k.row_height;
		const delta = Math.asin(y / radial.x);
		return radians + delta - Math.PI * 0.136;
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