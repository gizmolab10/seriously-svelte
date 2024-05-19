import { k, u, get, Rect, Size, Point, Angle, IDLine, Ancestry, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_asClusters } from '../state/State';
import { h } from '../db/DBDispatch';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRects: Array<ChildMapRect> = [];

	constructor(focusAncestry: Ancestry, origin: Point) {
		let childAncestries = focusAncestry.childAncestries;
		if (!get(s_layout_asClusters)) {
			let sum = -focusAncestry.visibleProgeny_height() / 2; // start out negative and grow positive
			for (const childAncestry of childAncestries) {
				sum += this.tree_layout(sum, childAncestry, focusAncestry, origin);
			}
		} else {
			this.cluster_layout(childAncestries, focusAncestry, Predicate.contains, origin, true);
			for (const predicate of h.predicates) {
				let oneAncestries = focusAncestry.thing?.oneAncestries_for(predicate) ?? [];
				this.cluster_layout(oneAncestries, focusAncestry, predicate, origin, false);
			}
		}
	}

	tree_layout(sum: number, childAncestry: Ancestry, ancestry: Ancestry, origin: Point) {
		const childHeight = childAncestry.visibleProgeny_height();
		const sizeY = sum + childHeight / 2;
		const direction = this.getDirection(sizeY);
		const rect = new Rect(origin, new Size(k.line_stretch, sizeY));
		const childOrigin = this.originForChildrenOf(childAncestry, origin, rect.extent);
		const map = new ChildMapRect(direction, rect, childOrigin, childAncestry, ancestry);
		this.childMapRects.push(map);
		return childHeight;
	}

	cluster_layout(ancestries: Array<Ancestry>, cluster_ancestry: Ancestry, predicate: Predicate | null, origin: Point, points_out: boolean) {
		const count = ancestries.length;
		if (count > 0 && !!predicate) {
			let index = 0;
			const radius = k.cluster_arc_radius;
			const radial = new Point(radius + k.necklace_gap, 0);
			const clusterLayout = new ClusterLayout(predicate, count, points_out);
			while (index < count) {
				const ancestry = ancestries[index];
				const childAngle = clusterLayout.childAngle_for(index, count, radius);
				const childOrigin = origin.offsetBy(radial.rotate_by(childAngle));
				const map = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, ancestry, cluster_ancestry, childAngle);
				this.childMapRects.push(map);
				index += 1;
			}
			this.clusterLayouts.push(clusterLayout);
		}
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