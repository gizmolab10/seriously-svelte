import { g, k, u, get, Path, Rect, Size, Point, Angles, IDLine, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
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
				const parentPaths = path.thing?.uniqueParentPaths_for(id) ?? [];
				this.layoutCluster(parentPaths, path, id, origin, false);
				if (predicate.directions == 2) {
					console.log(`${path.description}\nrelated:\n${parentPaths.map(p => p.description).join('\n')}`);
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
				const map = new ChildMapRect(direction, rect, childOrigin, childPath, path);
				this.childMapRectArray.push(map);
				sumOfSiblingsAbove += childHeight;
				index += 1;
			}
		}
	}

	layoutCluster(paths: Array<Path>, clusterPath: Path, idPredicate: string, origin: Point, pointsTo: boolean) {
		const length = paths.length;
		if (length > 0) {
			const clusterLayout = new ClusterLayout(idPredicate, pointsTo);
			const radius = k.necklace_gap + k.cluster_focus_radius;
			const start_angle = clusterLayout.angle;
			const radial = new Point(radius, 0);
			const start_row = (8 - length) / 2;
			this.clusterLayouts.push(clusterLayout);
			let index = 0;
			while (index < length) {
				const path = paths[index];
				const height = (start_row + index) * k.row_height;
				const angle = start_angle + Math.asin(height / radius);
				const childOrigin = origin.offsetBy(radial.rotateBy(angle));
				const map = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, path, clusterPath, angle % Angles.full);
				this.childMapRectArray.push(map);
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