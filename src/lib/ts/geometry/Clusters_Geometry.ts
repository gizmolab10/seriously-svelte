import { u, get, Angle, Ancestry, Predicate, debugReact } from '../common/Global_Imports';
import { Cluster_Map, Paging_State, Widget_MapRect } from '../common/Global_Imports';
import { s_paging_state, s_ancestry_focus } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export default class Clusters_Geometry {
	outward_cluster_maps: Array<Cluster_Map> = [];
	inward_cluster_maps: Array<Cluster_Map> = [];
	ancestry_focus!: Ancestry;

	// layout all the widgets, rings and arcs

	constructor() {
		debugReact.log_layout(`GEOMETRY (ts)  ${get(s_ancestry_focus)?.thing?.title}`);
		this.layoutAll_clusters();
		s_paging_state.subscribe((state: Paging_State) => {
			this.update_forPaging_state(state);
		});
	}

	destructor() {
		this.outward_cluster_maps.forEach(l => l.destructor());
		this.inward_cluster_maps.forEach(l => l.destructor());
	}

	get cluster_maps(): Array<Cluster_Map> { return u.concatenateArrays(this.inward_cluster_maps, this.outward_cluster_maps); }		// for lines and arcs
	cluster_maps_for(points_out: boolean): Array<Cluster_Map> { return points_out ? this.outward_cluster_maps : this.inward_cluster_maps; }
	cluster_map_for(points_out: boolean, predicate: Predicate): Cluster_Map { return this.cluster_maps_for(points_out)[predicate.stateIndex]; }
	
	get widget_maps(): Array<Widget_MapRect> {
		let widget_maps: Array<Widget_MapRect> = [];
		for (const map of this.cluster_maps) {
			if (!!map) {
				widget_maps = u.concatenateArrays(widget_maps, map.widget_maps);
			}
		}
		return widget_maps;		
	}

	cluster_mapFor(angle: number) {
		for (const cluster of this.cluster_maps) {
			if (!!cluster) {
				const [a, b] = cluster.thumb_map.adjusted_angles;
				if (angle.isClocklyBetween(a, b, Angle.full)) {
					return cluster;
				}
			}
		}
		return null;
	}

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const cluster_maps = this.cluster_maps_for(points_out);
			const paging_state = get(s_ancestry_focus)?.thing?.page_states?.paging_state_forPointsOut(points_out, predicate);
			const onePage = paging_state?.onePaging_from(ancestries) ?? [];
			const cluster_map = new Cluster_Map(ancestries.length, onePage, predicate, points_out);
			cluster_maps[predicate.stateIndex] = cluster_map;
		}
	}

	layoutAll_clusters() {
		this.destructor();
		const ancestry = get(s_ancestry_focus);
		const focus = ancestry.thing;
		let childAncestries = ancestry.childAncestries;
		this.layout_clusterFor(childAncestries, Predicate.contains, true);
		if (!!focus) {
			for (const predicate of h.predicates) {
				let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
				this.layout_clusterFor(ancestries, predicate, false);
			}
		}
	}

	update_forPaging_state(paging_state: Paging_State) {
		const ancestry = get(s_ancestry_focus);
		if (!!paging_state && !!ancestry) {
			if (paging_state.points_out) {
				let childAncestries = ancestry.childAncestries;
				this.layout_clusterFor(childAncestries, Predicate.contains, true);
			} else {
				const focus = ancestry.thing;
				if (!!focus) {
					for (const predicate of h.predicates) {
						let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
						this.layout_clusterFor(ancestries, predicate, false);
					}
				}
			}
		}	
	}

}