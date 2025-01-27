import { u, Thing, debug, Ancestry, Predicate, T_Predicate } from '../common/Global_Imports';
import { s_hierarchy, s_paging_state, s_ancestry_focus } from '../state/S_Stores';
import { Cluster_Map, S_Paging, G_Widget } from '../common/Global_Imports';
import Parent_Ancestry from '../data/runtime/Parent_Ancestry';
import { get } from 'svelte/store';

export default class Radial_Geometry {
	parent_cluster_maps: Array<Cluster_Map> = [];
	child_cluster_maps: Array<Cluster_Map> = [];
	ancestry_focus!: Ancestry;

	// layout all the widgets, radial and arcs

	constructor() {
		debug.log_layout(`GEOMETRY (ts)  ${get(s_ancestry_focus)?.thing?.title}`);
		this.layoutAll_clusters();
		s_paging_state.subscribe((state: S_Paging) => {
			this.update_forPaging_state(state);
		});
	}

	destructor() {
		this.child_cluster_maps.forEach(l => l.destructor());
		this.parent_cluster_maps.forEach(l => l.destructor());
	}

	get cluster_maps(): Array<Cluster_Map> { return u.concatenateArrays(this.parent_cluster_maps, this.child_cluster_maps); }		// for lines and arcs
	cluster_maps_toChildren(points_toChildren: boolean): Array<Cluster_Map> { return points_toChildren ? this.child_cluster_maps : this.parent_cluster_maps; }
	cluster_map_toChildren(points_toChildren: boolean, predicate: Predicate): Cluster_Map { return this.cluster_maps_toChildren(points_toChildren)[predicate.stateIndex]; }

	widget_mapFor(ancestry: Ancestry): G_Widget | null {
		const maps = this.g_widgets.filter(m => m.widget_ancestry?.hid == ancestry.hid);
		return maps.length > 0 ? maps[0] : null;
	}

	get g_widgets(): Array<G_Widget> {
		let g_widgets: Array<G_Widget> = [];
		for (const cluster_map of this.cluster_maps) {
			if (!!cluster_map) {
				for (const g_widget of cluster_map.g_widgets) {
					g_widgets.push(g_widget);
				}
			}
		}
		return g_widgets;		
	}

	get cluster_mapFor_mouseLocation(): Cluster_Map | null {
		for (const cluster_map of this.cluster_maps) {
			if (!!cluster_map && cluster_map.thumb_isHit) {
				return cluster_map;
			}
		}
		return null;
	}

	parent_ancestries_maybeFor(focus: Thing, predicate: Predicate): Array<Ancestry> {
		let ancestries = focus.uniqueAncestries_for(predicate);
		if (predicate.kind == T_Predicate.isRelated) {
			ancestries = ancestries.map(a => new Parent_Ancestry(a));
		}
		return ancestries;
	}

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, points_toChildren: boolean) {
		if (!!predicate) {
			const paging_state = get(s_ancestry_focus)?.thing?.page_states?.paging_state_forPointingTo(points_toChildren, predicate);
			const onePageOf_ancestries = paging_state?.onePage_from(ancestries) ?? [];
			const cluster_map = new Cluster_Map(ancestries.length, onePageOf_ancestries, predicate, points_toChildren);
			const cluster_maps = this.cluster_maps_toChildren(points_toChildren);
			cluster_maps[predicate.stateIndex] = cluster_map;
		}
	}

	layoutAll_clusters() {
		this.destructor();
		const focus_ancestry = get(s_ancestry_focus);
		const focus_thing = focus_ancestry.thing;
		let childAncestries = focus_ancestry.childAncestries;
		this.layout_clusterFor(childAncestries, Predicate.contains, true);
		if (!!focus_thing) {
			for (const predicate of get(s_hierarchy).predicates) {
				let ancestries = this.parent_ancestries_maybeFor(focus_thing, predicate);
				this.layout_clusterFor(ancestries, predicate, false);
			}
		}
	}

	update_forPaging_state(paging_state: S_Paging) {
		const focus_ancestry = get(s_ancestry_focus);
		if (!!paging_state && !!focus_ancestry) {
			if (paging_state.points_toChildren) {
				let childAncestries = focus_ancestry.childAncestries;
				this.layout_clusterFor(childAncestries, Predicate.contains, true);
			} else {
				const focus_thing = focus_ancestry.thing;
				if (!!focus_thing) {
					for (const predicate of get(s_hierarchy).predicates) {
						let ancestries = focus_thing.uniqueAncestries_for(predicate) ?? [];
						this.layout_clusterFor(ancestries, predicate, false);
					}
				}
			}
		}	
	}

}