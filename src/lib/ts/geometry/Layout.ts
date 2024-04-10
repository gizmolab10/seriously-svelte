import { g, k, u, get, Path, Rect, Size, Point, Angles, IDLine, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_byClusters } from '../common/State';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRectArray: Array<ChildMapRect> = [];

	constructor(path: Path, origin: Point) {
		let childPaths = path.paths_get_children;
		if (get(s_layout_byClusters)) {
			const idContains = Predicate.idContains;
			if (path.hasChildRelationships) {
				this.layoutCluster(childPaths, new ClusterLayout(idContains, true), path, origin);
			}
			for (const predicate of g.hierarchy.predicates) {	// and another 'idContains' for parents
				if (path.showsClusterFor(predicate)) {
					const idIsRelated = Predicate.idIsRelated
					const cluster = new ClusterLayout(predicate.id, false);
					if (predicate.id == idIsRelated && path.idPredicate != idIsRelated) {
						return;
					}
					childPaths = path.paths_uniquelyFor(predicate) ?? [];
					this.layoutCluster(childPaths, cluster, path, origin);
				}
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
				const childMapRect = new ChildMapRect(direction, rect, childOrigin, childPath, path);
				this.childMapRectArray.push(childMapRect);
				sumOfSiblingsAbove += childHeight;
				index += 1;
			}
		}
	}

	layoutCluster(paths: Array<Path>, clusterLayout: ClusterLayout, path: Path, origin: Point) {
		this.clusterLayouts.push(clusterLayout);
		let index = 0;
		const length = paths.length;
		const start_row = (8 - length) / 2;
		const start_angle = clusterLayout.angle;
		const radius = k.necklace_gap + k.cluster_focus_radius;
		const radial = new Point(radius, 0);
		while (index < length) {
			const childPath = paths[index];
			const height = (start_row + index) * k.row_height;
			const angle = start_angle + Math.asin(height / radius);
			const childOrigin = origin.offsetBy(radial.rotateBy(angle));
			const childMapRect = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, childPath, path, angle % Angles.full);
			this.childMapRectArray.push(childMapRect);
			index += 1;
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