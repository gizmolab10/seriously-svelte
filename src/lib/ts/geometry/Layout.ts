import { k, u, get, Ancestry, Rect, Size, Point, Angle, IDLine, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { s_layout_asClusters } from '../state/State';
import { h } from '../db/DBDispatch';

export default class Layout {
	clusterLayouts: Array<ClusterLayout> = [];
	childMapRects: Array<ChildMapRect> = [];

	constructor(focusAncestry: Ancestry, origin: Point) {
		let childAncestries = focusAncestry.childAncestries;
		if (get(s_layout_asClusters)) {
			let points_out = true;
			this.cluster_layout(childAncestries, focusAncestry, Predicate.contains, origin, points_out);
			points_out = false;
			for (const predicate of h.predicates) {
				let oneAncestries = focusAncestry.thing?.oneAncestries_for(predicate) ?? [];
				this.cluster_layout(oneAncestries, focusAncestry, predicate, origin, points_out);
			}
		} else {
			let index = 0;
			const length = childAncestries.length;
			let sum = -focusAncestry.visibleProgeny_height() / 2; // start out negative and grow positive
			while (index < length) {
				const childAncestry = childAncestries[index];
				sum += this.tree_layout(sum, childAncestry, focusAncestry, origin);
				index += 1;
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
			const radius = k.necklace_radius;
			const radial = new Point(radius + k.necklace_gap, 0);
			const clusterLayout = new ClusterLayout(predicate, count, points_out);
			while (index < count) {
				const ancestry = ancestries[index];
				const childAngle = this.childAngle_for(index, count, clusterLayout, radius);
				const childOrigin = origin.offsetBy(radial.rotate_by(childAngle));
				const map = new ChildMapRect(IDLine.flat, new Rect(), childOrigin, ancestry, cluster_ancestry, childAngle);
				this.childMapRects.push(map);
				if (index == 0) {
					clusterLayout.start_angle = childAngle;
				}
				index += 1;
				if (index == count) {
					clusterLayout.end_angle = childAngle;
				}
			}
			this.clusterLayouts.push(clusterLayout);
		}
	}

	childAngle_for(index: number, count: number, clusterLayout: ClusterLayout, radius: number): number {
		const row = index - ((count - 1) / 2);				// row centered around zero
		const radial = new Point(radius, 0);
		const clusterAngle = clusterLayout.line_angle;		// depends on s_cluster_angle, predicate kind & points_out
		const startY = radial.rotate_by(clusterAngle).y;	// height of clusterAngle
		let y = startY + (row * (k.row_height - 2));		// height of row
		let unfit = false;
		if (Math.abs(y) > radius) {
			unfit = true;
			y = radius - (y % radius);
		}
		let ratio = y / radius;
		let angle = u.normalized_angle(-Math.asin(ratio));	// negate arc sign for clockwise
		if (!clusterLayout.points_out && clusterLayout.predicate?.id != Predicate.idIsRelated) {
			angle = u.normalized_angle(Angle.half - angle);
		}
		if (unfit) {
			const quadrant = u.quadrant_of(angle);
			const pivot = u.startAngle_ofQuadrant(quadrant);
			angle = u.normalized_angle(-angle - Angle.quarter + pivot);
		}
		return angle;
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