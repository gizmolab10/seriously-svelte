import { k, u, get, Angle, Ancestry, Predicate, Cluster_Layout, Widget_MapRect, Scrolling_Divider_MapRect } from '../common/GlobalImports';
import { s_clusters, s_ancestry_focus, s_cluster_arc_radius } from '../state/ReactiveState';
import { h } from '../db/DBDispatch';

export default class Clusters_Geometry {
	divider_maps: Array<Scrolling_Divider_MapRect> = [];
	cluster_layouts: Array<Cluster_Layout> = [];
    ancestry_focus = get(s_ancestry_focus);
	widget_maps: Array<Widget_MapRect> = [];
	ancestries: Array<Ancestry> = [];

	// responsible for 
	// grabbing the things and their ancestries
	// layout of all the clusters' lines, arcs
	// positions of all the widgets

	constructor() { this.setup(); }

	destructor() {
		this.cluster_layouts.forEach(l => l.destructor());
		this.cluster_layouts = [];
		this.widget_maps = [];
	}

	setup() {
		this.destructor();
		const focus = this.ancestry_focus.thing;
		let childAncestries = this.ancestry_focus.childAncestries;
		this.layout(childAncestries, Predicate.contains, true);
		if (!!focus) {
			for (const predicate of h.predicates) {
				let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
				this.layout(ancestries, predicate, false);
			}
		}
		this.setup_divider_maps();
	}

	setup_divider_maps() {
		let first_angle!: number;
		let prior_end_angle!: number;
		let divider_angles: Array<number> = [];
		function add_divider_angle(start: number, end: number) {
			const delta = end - start;
			const divider_angle = Angle.full.normalize(delta);
			divider_angles.push(divider_angle);
		}
		for (const cluster_ayout of this.cluster_layouts) {
			const angle_atStart = cluster_ayout.angle_atStart
			const angle_atEnd = cluster_ayout.angle_atEnd
			if (!first_angle) {
				first_angle = angle_atStart;
			}
			if (prior_end_angle) {
				add_divider_angle(prior_end_angle, angle_atStart);
			}
			prior_end_angle = angle_atEnd;
		}
		add_divider_angle(first_angle, prior_end_angle);
		divider_angles.forEach((angle, index) => {
			const divider_map = new Scrolling_Divider_MapRect(angle, index);
			this.divider_maps.push(divider_map);
		});
	}

	onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const maxFit = Math.round(get(s_cluster_arc_radius) * 2 / k.row_height) - 6;
		const pageIndex = get(s_clusters).index_for(points_out, predicate);
		return ancestries.slice(pageIndex, pageIndex + maxFit);
	}

	layout(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const onePage = this.onePage_from(ancestries, predicate, points_out);
			const cluster_layout = new Cluster_Layout(ancestries.length, onePage, predicate, points_out);
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