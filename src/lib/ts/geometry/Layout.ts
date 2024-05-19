import { k, u, get, Rect, Size, Point, Angle, IDLine, Ancestry, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_asClusters } from '../state/State';
import { h } from '../db/DBDispatch';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRects: Array<ChildMapRect> = [];

	constructor(focusAncestry: Ancestry, origin: Point) {
		let childAncestries = focusAncestry.childAncestries;
		if (get(s_layout_asClusters)) {
			this.cluster_layout(focusAncestry, childAncestries, Predicate.contains, origin, true);
			for (const predicate of h.predicates) {
				let oneAncestries = focusAncestry.thing?.oneAncestries_for(predicate) ?? [];
				this.cluster_layout(focusAncestry, oneAncestries, predicate, origin, false);
			}
		} else {
			let sum = -focusAncestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				sum += this.tree_layout(sum, focusAncestry, childAncestry, origin);
			}
		}
	}

	cluster_layout(cluster_ancestry: Ancestry, ancestries: Array<Ancestry>, predicate: Predicate | null, origin: Point, points_out: boolean) {
		const clusterLayout = new ClusterLayout(cluster_ancestry, ancestries, predicate, points_out);
		const clusterMaps = clusterLayout.childMapRects(origin);
		this.childMapRects = u.concatenateArrays(this.childMapRects, clusterMaps);
		this.clusterLayouts.push(clusterLayout);
	}

	tree_layout(sum: number, ancestry: Ancestry, childAncestry: Ancestry, origin: Point) {
		const childHeight = childAncestry.visibleProgeny_height();
		const sizeY = sum + childHeight / 2;
		const direction = this.getDirection(sizeY);
		const rect = new Rect(origin, new Size(k.line_stretch, sizeY));
		const childOrigin = this.originForChildrenOf(childAncestry, origin, rect.extent);
		const map = new ChildMapRect(direction, rect, childOrigin, childAncestry, ancestry);
		this.childMapRects.push(map);
		return childHeight;
	}

	originForChildrenOf(childAncestry: Ancestry, origin: Point, extent: Point): Point {
		const child = childAncestry.thing;
		let x, y = 0;
		if (child) {
			y = extent.y - childAncestry.visibleProgeny_halfHeight - 0.5;
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