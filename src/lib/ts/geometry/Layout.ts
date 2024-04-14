import { g, k, u, get, Path, Rect, Size, Point, Angle, IDLine, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_byClusters } from '../common/State';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRects: Array<ChildMapRect> = [];

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
				this.childMapRects.push(map);
				sumOfSiblingsAbove += childHeight;
				index += 1;
			}
		}
	}

	layoutCluster(paths: Array<Path>, clusterPath: Path, idPredicate: string, origin: Point, pointsTo: boolean) {
		const count = paths.length;
		if (count > 0) {
			let index = 0;
			const radius = k.necklace_gap + k.cluster_inside_radius;
			const clusterLayout = new ClusterLayout(idPredicate, count, pointsTo);
			while (index < count) {
				const path = paths[index];
				const childAngle = this.childAngle_for(index, count, clusterLayout, radius);
				const childOrigin = origin.offsetBy(new Point(radius, 0).rotate_by(childAngle));
				const map = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, path, clusterPath, childAngle);
				console.log(`childAngle ${childAngle} ${idPredicate} \"${path.title}\"`);
				this.childMapRects.push(map);
				index += 1;
			}
			this.clusterLayouts.push(clusterLayout);
		}
	}

	childAngle_for(index: number, count: number, clusterLayout: ClusterLayout, radius: number): number {
		const row = index - (count / 2);					// row centered around zero
		const radial = new Point(radius, 0);
		const clusterAngle = clusterLayout.angle;			// depends on s_cluster_angle, predicate kind & pointsTo
		const startY = radial.rotate_by(clusterAngle).y;	// height of clusterAngle
		let y = startY + (row * k.row_height);				// height of row
		if (Math.abs(y) > radius) {
			y = radius;
		}
		const angle = u.normalized_angle(-Math.asin(y / radius));	// negate arc sign for clockwise
		return angle;
	}

	broken_childAngle_for(row: number, count: number, clusterAngle: number, radial: Point): number {
		const start_row = (8 - count) / 2;
		const y = (start_row + row) * k.row_height;
		const delta = Math.asin(y / radial.x);
		return u.normalized_angle(clusterAngle + delta - Math.PI * 0.136);
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
		} else if (delta < 0) {
			return IDLine.up;
		} else {
			return IDLine.down;
		}
	}
}