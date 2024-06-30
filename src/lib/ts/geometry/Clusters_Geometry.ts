import { k, u, get, Ancestry, Predicate, Cluster_Map, Widget_MapRect } from '../common/Global_Imports';
import { s_clusters_page_states, s_ancestry_focus, s_cluster_arc_radius } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export default class Clusters_Geometry {
	widget_maps: Array<Widget_MapRect> = [];
	cluster_maps: Array<Cluster_Map> = [];
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
	}

	onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const maxFit = Math.round(get(s_cluster_arc_radius) * 2 / k.row_height) - 6;
		const page_state = get(s_clusters_page_states).index_for(points_out, predicate);
		return ancestries.slice(page_state, page_state + maxFit);
	}

	layout_necklace_andLines(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const onePage = this.onePage_from(ancestries, predicate, points_out);
			const cluster_map = new Cluster_Map(ancestries.length, onePage, predicate, points_out);
			this.widget_maps = u.concatenateArrays(this.widget_maps, cluster_map.widget_maps);	// for necklace of widgets
			this.cluster_maps.push(cluster_map);		// for lines and arcs
		}
	}

	apportionAncestries() {}

	// determine angular stretch for predicate + line angle + fit length
	stretch_forPredicate_angle_length(predicate: Predicate, angle: number, fitTo: number): number {
		return 0;
	}

}