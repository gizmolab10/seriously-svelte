import { k, u, get, Angle, Ancestry, Predicate, ClusterLayout, WidgetMapRect, ClusterStates } from '../common/GlobalImports';
import { s_clusters, s_ancestry_focus, s_cluster_arc_radius } from '../state/ReactiveState';
import { h } from '../db/DBDispatch';

export default class ClustersGeometry {
	cluster_layouts: Array<ClusterLayout> = [];
	widget_maps: Array<WidgetMapRect> = [];
	divider_angles: Array<number> = [];
	ancestries: Array<Ancestry> = [];
    ancestry = get(s_ancestry_focus);

	constructor() { this.setup(); }

	destructor() {
		this.cluster_layouts.forEach(l => l.destructor());
		this.cluster_layouts = [];
		this.widget_maps = [];
	}

	setup() {
		this.destructor();
		const thing = this.ancestry.thing;
		let childAncestries = this.ancestry.childAncestries;
		this.layout(childAncestries, Predicate.contains, true);
		if (!!thing) {
			for (const predicate of h.predicates) {
				let ancestries = thing.uniqueAncestries_for(predicate) ?? [];
				this.layout(ancestries, predicate, false);
			}
		}
		this.compute_divider_angles();
	}

	compute_divider_angles() {
		this.divider_angles = [];
		let first_angle!: number;
		let prior_end_angle!: number;
		for (const cluster_ayout of this.cluster_layouts) {
			const angle_atStart = cluster_ayout.angle_atStart
			const angle_atEnd = cluster_ayout.angle_atEnd
			if (!first_angle) {
				first_angle = angle_atStart;
			}
			if (prior_end_angle) {
				this.add_divider_angle(prior_end_angle, angle_atStart);
			}
			prior_end_angle = angle_atEnd;
		}
		this.add_divider_angle(first_angle, prior_end_angle);
	}

	add_divider_angle(start: number, end: number) {
		const delta = end - start;
		const divider_angle = Angle.full.normalize(delta);
		this.divider_angles.push(divider_angle);
	}

	onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const maxFit = Math.round(get(s_cluster_arc_radius) * 2 / k.row_height) - 6;
		const pageIndex = get(s_clusters).index_for(points_out, predicate);
		return ancestries.slice(pageIndex, pageIndex + maxFit);
	}

	layout(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const onePage = this.onePage_from(ancestries, predicate, points_out);
			const cluster_layout = new ClusterLayout(ancestries.length, onePage, predicate, points_out);
			this.widget_maps = u.concatenateArrays(this.widget_maps, cluster_layout.widget_maps);	// for necklace of widgets
			this.cluster_layouts.push(cluster_layout);		// for lines and arcs
		}
	}

	apportionAncestries() {}

	// determine angular stretch for predicate + line angle + fit length
	stretch_forPredicate_angle_length(predicate: Predicate, angle: number, fitTo: number): number {
		return 0;
	}

}