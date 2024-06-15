import { s_indices_cluster, s_ancestry_focus, s_indices_reversed, s_cluster_arc_radius } from '../state/ReactiveState';
import { k, u, get, Point, Ancestry, Predicate, ChildMapRect, ClusterLayout } from '../common/GlobalImports';
import { h } from '../db/DBDispatch';

export default class ClusterLayouts {
	childMapRects: Array<ChildMapRect> = [];
	layouts: Array<ClusterLayout> = [];
	angularSpreads: Array<number> = [];
	ancestries: Array<Ancestry> = [];
    ancestry = get(s_ancestry_focus);
	center: Point;

	constructor(center: Point) {
		this.center = center;
		const thing = this.ancestry.thing;
		let childAncestries = this.ancestry.childAncestries;
		this.layout(childAncestries, Predicate.contains, true);
		if (!!thing) {
			for (const predicate of h.predicates) {
				let ancestries = thing.uniqueAncestries_for(predicate) ?? [];
				this.layout(ancestries, predicate, false);
			}
		}
	}

	destructor() {
		this.layouts.forEach(l => l.destructor());
		this.layouts = [];
		this.childMapRects = [];
	}

	onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const indices = points_out ? get(s_indices_cluster) : get(s_indices_reversed);
		const maxFit = Math.round(get(s_cluster_arc_radius) * 2 / k.row_height);
		const predicateIndex = predicate.stateIndex;
		const pageIndex = indices[predicateIndex];	// make sure it exists: hierarchy
		return ancestries.slice(pageIndex, pageIndex + maxFit);
	}

	layout(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const onePage = this.onePage_from(ancestries, predicate, points_out);
			const layout = new ClusterLayout(this.ancestry, onePage, predicate, points_out);
			this.childMapRects = u.concatenateArrays(this.childMapRects, layout.childMapRects(this.center));	// for necklace of widgets
			this.layouts.push(layout);		// for lines and arcs
		}
	}

	apportionAncestries() {}

	// determine angular stretch for predicate + line angle + fit length
	stretch_forPredicate_angle_length(predicate: Predicate, angle: number, fitTo: number): number {
		return 0;
	}

}