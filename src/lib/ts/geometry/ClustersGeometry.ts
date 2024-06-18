import { k, u, get, Ancestry, Predicate, ClusterMap, WidgetMapRect, ClusterStates } from '../common/GlobalImports';
import { s_clusters, s_ancestry_focus, s_cluster_arc_radius } from '../state/ReactiveState';
import { h } from '../db/DBDispatch';

export default class ClustersGeometry {
	widget_maps: Array<WidgetMapRect> = [];
	cluster_maps: Array<ClusterMap> = [];
	angularSpreads: Array<number> = [];
	ancestries: Array<Ancestry> = [];
    ancestry = get(s_ancestry_focus);

	constructor() { this.setup(); }

	destructor() {
		this.cluster_maps.forEach(l => l.destructor());
		this.cluster_maps = [];
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
	}

	onePage_from(ancestries: Array<Ancestry>, predicate: Predicate, points_out: boolean): Array<Ancestry> {
		const maxFit = Math.round(get(s_cluster_arc_radius) * 2 / k.row_height) - 6;
		const pageIndex = get(s_clusters).index_for(points_out, predicate);
		return ancestries.slice(pageIndex, pageIndex + maxFit);
	}

	layout(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const onePage = this.onePage_from(ancestries, predicate, points_out);
			const cluster_map = new ClusterMap(ancestries.length, onePage, predicate, points_out);
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