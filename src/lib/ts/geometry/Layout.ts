import { k, u, get, Path, Rect, Size, Point, Angle, IDLine, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_asClusters } from '../state/State';
import { h } from '../db/DBDispatch';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRects: Array<ChildMapRect> = [];

	constructor(focusPath: Path, origin: Point) {
		let childPaths = focusPath.childPaths;
		if (get(s_layout_asClusters)) {
			this.layoutCluster(childPaths, focusPath, Predicate.idContains, origin, true);
			for (const predicate of h.predicates) {
				const id = predicate.id;
				const parentPaths = focusPath.uniqueParentPaths_for(id);
				this.layoutCluster(parentPaths, focusPath, id, origin, false);
			}
		} else {
			let index = 0;
			const length = childPaths.length;
			let sum = -focusPath.visibleProgeny_height() / 2; // start out negative and grow positive
			while (index < length) {
				const childPath = childPaths[index];
				sum += this.layoutChildren(sum, childPath, focusPath, origin);
				index += 1;
			}
		}
	}

	layoutChildren(sum: number, childPath: Path, path: Path, origin: Point) {
		const childHeight = childPath.visibleProgeny_height();
		const sizeY = sum + childHeight / 2;
		const direction = this.getDirection(sizeY);
		const rect = new Rect(origin, new Size(k.line_stretch, sizeY));
		const childOrigin = this.originForChildrenOf(childPath, origin, rect.extent);
		const map = new ChildMapRect(direction, rect, childOrigin, childPath, path);
		this.childMapRects.push(map);
		return childHeight;
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
				this.childMapRects.push(map);
				index += 1;
			}
			this.clusterLayouts.push(clusterLayout);
		}
	}

	childAngle_for(index: number, count: number, clusterLayout: ClusterLayout, radius: number): number {
		const row = index - ((count - 1) / 2);					// row centered around zero
		const radial = new Point(radius, 0);
		const clusterAngle = clusterLayout.angle;			// depends on s_cluster_angle, predicate kind & pointsTo
		const startY = radial.rotate_by(clusterAngle).y;	// height of clusterAngle
		let y = startY + (row * k.row_height);				// height of row
		if (Math.abs(y) > radius) {
			y = radius;
		}
		let angle = u.normalized_angle(-Math.asin(y / radius));	// negate arc sign for clockwise
		if (!clusterLayout.pointsTo && clusterLayout.idPredicate != Predicate.idIsRelated) {
			angle = u.normalized_angle(Angle.half - angle);
		}
		return angle;
	}

	originForChildrenOf(childPath: Path, origin: Point, extent: Point): Point {
		const child = childPath.thing;
		let x, y = 0;
		if (child) {
			y = extent.y - childPath.visibleProgeny_halfHeight - 0.5;
			x = origin.x + child.titleWidth + k.dot_size + k.line_stretch - 1;
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