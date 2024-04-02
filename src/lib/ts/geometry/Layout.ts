import { k, g, get, Path, Rect, Size, Point, IDLine, Predicate, ChildMapRect, NecklaceCluster } from '../common/GlobalImports';
import { s_layout_byClusters } from '../common/State';

export default class Layout {
	clusterArray: Array<NecklaceCluster> = [];
	childMapRectArray: Array<ChildMapRect> = [];

	constructor(path: Path, origin: Point) {
		const childPaths = path.childPaths;
		if (get(s_layout_byClusters)) {
			const thing = path.thing;
			const contains = g.hierarchy.predicate_byHID[Predicate.idContains.hash()];
			this.cluster_layout(childPaths, new NecklaceCluster(contains, true), path, origin);
			for (const predicate of g.hierarchy.predicates) {
				const cluster = new NecklaceCluster(predicate, false);
				const paths = thing?.paths_uniquelyFromFor(predicate.id) ?? [];
				this.cluster_layout(paths, cluster, path, origin);
			}
		} else {
			let sumOfSiblingsAbove = -path.visibleProgeny_height() / 2; // start out negative and grow positive
			const length = childPaths.length;
			let index = 0;
			const sizeX = k.line_stretch;
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

	cluster_layout(paths: Array<Path>, cluster: NecklaceCluster, path: Path, origin: Point) {
		let index = 0;
		const length = paths.length;
		const radius = k.necklace_radius;
		const radial = new Point(radius, 0);
		const rowStart = Math.max(-2, (6 - length)) / 2;
		const angleStart = cluster.necklace_angle;
		while (index < length) {
			const childPath = paths[index];
			const angle = Math.asin((rowStart + index) * k.row_height / radius);
			const point = radial.rotateBy(angleStart + angle);
			const childOrigin = origin.offsetBy(point);
			const childMapRect = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, childPath, null);
			this.childMapRectArray.push(childMapRect);
			index += 1;
		}
		this.clusterArray.push(cluster);
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