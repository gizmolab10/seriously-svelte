import { u, get, Ancestry, Page_State, Predicate, Cluster_Map, Widget_MapRect } from '../common/Global_Imports';
import { s_page_state, s_ancestry_focus } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export default class Clusters_Geometry {
	outward_cluster_maps: Array<Cluster_Map> = [];
	inward_cluster_maps: Array<Cluster_Map> = [];
	ancestry_focus!: Ancestry;

	// layout all the widgets, rings and arcs

	constructor() {
		this.layout();
		s_page_state.subscribe((state: Page_State) => {
			this.update_forPage_state(state);
		});
	}

	update_forPage_state(page_state: Page_State) {
		const ancestry = get(s_ancestry_focus);
		if (!!page_state && !!ancestry) {
			if (page_state.points_out) {
				let childAncestries = ancestry.childAncestries;
				this.layout_rotation_ring_andLines(childAncestries, Predicate.contains, true);
			} else {
				const focus = ancestry.thing;
				if (!!focus) {
					for (const predicate of h.predicates) {
						let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
						this.layout_rotation_ring_andLines(ancestries, predicate, false);
					}
				}
			}
		}	
	}

	get cluster_maps(): Array<Cluster_Map> { return u.concatenateArrays(this.inward_cluster_maps, this.outward_cluster_maps); }		// for lines and arcs
	cluster_maps_for(points_out: boolean): Array<Cluster_Map> { return points_out ? this.outward_cluster_maps : this.inward_cluster_maps; }
	cluster_map_for(points_out: boolean, predicate: Predicate): Cluster_Map { return this.cluster_maps_for(points_out)[predicate.stateIndex]; }
	
	get widget_maps(): Array<Widget_MapRect> {
		let widget_maps: Array<Widget_MapRect> = [];
		for (const cluster_map of this.cluster_maps) {
			if (!!cluster_map) {
				widget_maps = u.concatenateArrays(widget_maps, cluster_map.widget_maps);
			}
		}
		return widget_maps;		
	}

	destructor() {
		this.outward_cluster_maps.forEach(l => l.destructor());
		this.inward_cluster_maps.forEach(l => l.destructor());
	}

	layout() {
		this.destructor();
		const ancestry = get(s_ancestry_focus);
		const focus = ancestry.thing;
		let childAncestries = ancestry.childAncestries;
		this.layout_rotation_ring_andLines(childAncestries, Predicate.contains, true);
		if (!!focus) {
			for (const predicate of h.predicates) {
				let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
				this.layout_rotation_ring_andLines(ancestries, predicate, false);
			}
		}
	}

	layout_rotation_ring_andLines(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const cluster_maps = this.cluster_maps_for(points_out);
			const page_state = get(s_ancestry_focus)?.thing?.page_states?.page_state_for(points_out, predicate);
			const onePage = page_state?.onePage_from(ancestries) ?? [];
			const cluster_map = new Cluster_Map(ancestries.length, onePage, predicate, points_out);
			cluster_maps[predicate.stateIndex] = cluster_map;
		}
	}

}