import { k, u, get, Ancestry, Predicate, Cluster_Maps, Widget_MapRect, Divider_MapRect } from '../common/GlobalImports';
import { s_clusters, s_ancestry_focus, s_cluster_arc_radius } from '../state/ReactiveState';
import { h } from '../db/DBDispatch';

export default class Clusters_Geometry {
	divider_maps: Array<Divider_MapRect> = [];
	widget_maps: Array<Widget_MapRect> = [];
	cluster_maps: Array<Cluster_Maps> = [];
	ancestries: Array<Ancestry> = [];

	// layout_necklace_andLines all the widgets, lines, arcs,
	// and scrolling ring dividers

	constructor() { this.layout(); }

	destructor() {
		this.cluster_maps.forEach(l => l.destructor());
		this.cluster_maps = [];
		this.widget_maps = [];
	}

	layout() {
		this.destructor();
		const ancestry_focus = get(s_ancestry_focus);
		const focus = ancestry_focus.thing;
		let childAncestries = ancestry_focus.childAncestries;
		this.layout_necklace_andLines(childAncestries, Predicate.contains, true);
		if (!!focus) {
			for (const predicate of h.predicates) {
				let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
				this.layout_necklace_andLines(ancestries, predicate, false);
			}
		}
		this.layout_divider_maps();
	}

	layout_divider_maps() {
		this.divider_maps = [];
		let first_angle!: number;
		let prior_end_angle!: number;
		let divider_angles: Array<number> = [];
		for (const cluster_ayout of this.cluster_maps) {
			const angle_atEnd = cluster_ayout.angle_atEnd;
			const angle_atStart = cluster_ayout.angle_atStart;
			if (prior_end_angle) {
				divider_angles.push((angle_atStart + prior_end_angle) / 2);
			}
			prior_end_angle = angle_atEnd;
			if (!first_angle) {
				first_angle = angle_atStart;
			}
		}
		divider_angles.push((first_angle + prior_end_angle) / 2);
		divider_angles.forEach((angle, index) => {
			this.divider_maps[index] = new Divider_MapRect(index, angle);
		});
	}

	onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const maxFit = Math.round(get(s_cluster_arc_radius) * 2 / k.row_height) - 6;
		const pageIndex = get(s_clusters).index_for(points_out, predicate);
		return ancestries.slice(pageIndex, pageIndex + maxFit);
	}

	layout_necklace_andLines(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const onePage = this.onePage_from(ancestries, predicate, points_out);
			const cluster_maps = new Cluster_Maps(ancestries.length, onePage, predicate, points_out);
			this.widget_maps = u.concatenateArrays(this.widget_maps, cluster_maps.widget_maps);	// for necklace of widgets
			this.cluster_maps.push(cluster_maps);		// for lines and arcs
		}
	}

	apportionAncestries() {}

	// determine angular stretch for predicate + line angle + fit length
	stretch_forPredicate_angle_length(predicate: Predicate, angle: number, fitTo: number): number {
		return 0;
	}

}