import { k, u, get, Ancestry, Page_State, Predicate, Cluster_Map, Widget_MapRect } from '../common/Global_Imports';
import { s_page_state, s_ancestry_focus, s_cluster_arc_radius } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export default class Clusters_Geometry {
	outward_cluster_maps: Array<Cluster_Map> = [];
	inward_cluster_maps: Array<Cluster_Map> = [];
	ancestries: Array<Ancestry> = [];
	ancestry_focus!: Ancestry;

	// layout_necklace_andLines all the widgets, lines, arcs,
	// and scrolling ring dividers

	constructor() {
		this.layout();
		s_page_state.subscribe((state: Page_State) => { this.update_forPage_state(state)});
	}

	update_forPage_state(page_state: Page_State) {
		const ancestry = get(s_ancestry_focus);
		if (!!page_state && !!ancestry) {
			if (page_state.points_out) {
				let childAncestries = ancestry.childAncestries;
				this.layout_necklace_andLines(childAncestries, Predicate.contains, true);
			} else {
				const focus = ancestry.thing;
				if (!!focus) {
					for (const predicate of h.predicates) {
						let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
						this.layout_necklace_andLines(ancestries, predicate, false);
					}
				}
			}
		}	
	}

	get widget_maps(): Array<Widget_MapRect> { return this.cluster_maps.flatMap(c => c.widget_maps) }					// for necklace of widgets
	get cluster_maps(): Array<Cluster_Map> { return [...this.outward_cluster_maps, ...this.inward_cluster_maps]; }		// for lines and arcs
	cluster_maps_for(points_out: boolean): Array<Cluster_Map> { return points_out ? this.outward_cluster_maps : this.inward_cluster_maps; }
	cluster_map_for(points_out: boolean, predicate: Predicate): Cluster_Map { return this.cluster_maps_for(points_out)[predicate.stateIndex]; }
	set_cluster_map_for(cluster_map: Cluster_Map, points_out: boolean, predicate: Predicate) { this.cluster_maps_for(points_out)[predicate.stateIndex] = cluster_map; }

	destructor() {
		this.outward_cluster_maps.forEach(l => l.destructor());
		this.inward_cluster_maps.forEach(l => l.destructor());
	}

	layout() {
		this.destructor();
		const ancestry = get(s_ancestry_focus);
		const focus = ancestry.thing;
		let childAncestries = ancestry.childAncestries;
		this.layout_necklace_andLines(childAncestries, Predicate.contains, true);
		if (!!focus) {
			for (const predicate of h.predicates) {
				let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
				this.layout_necklace_andLines(ancestries, predicate, false);
			}
		}
	}

	layout_necklace_andLines(ancestries: Array<Ancestry>, predicate: Predicate | null, points_out: boolean) {
		if (!!predicate) {
			const page_state = get(s_ancestry_focus)?.thing?.page_states?.page_state_for(points_out, predicate);
			const onePage = page_state?.onePage_from(ancestries) ?? [];
			const cluster_map = new Cluster_Map(ancestries.length, onePage, predicate, points_out);
			this.set_cluster_map_for(cluster_map, points_out, predicate);
		}
	}

	apportionAncestries() {}

	// determine angular stretch for predicate + line angle + fit length
	stretch_forPredicate_angle_length(predicate: Predicate, angle: number, fitTo: number): number {
		return 0;
	}

}