import { u, Thing, debug, Ancestry, Predicate } from '../common/Global_Imports';
import { Cluster_Map, Paging_State, Widget_MapRect } from '../common/Global_Imports';
import { s_focus_ancestry, s_ancestry_showing_tools } from '../state/Svelte_Stores';
import { s_hierarchy, s_paging_state } from '../state/Svelte_Stores';
import Parent_Ancestry from '../managers/Parent_Ancestry';
import { get } from 'svelte/store';

export default class Clusters_Geometry {
	tools_widget_map: Widget_MapRect | null = null;
	parent_cluster_maps: Array<Cluster_Map> = [];
	child_cluster_maps: Array<Cluster_Map> = [];
	ancestry_focus!: Ancestry;

	// layout all the widgets, radial and arcs

	constructor() {
		debug.log_layout(`GEOMETRY (ts)  ${get(s_focus_ancestry)?.thing?.title}`);
		this.layoutAll_clusters();
		s_paging_state.subscribe((state: Paging_State) => {
			this.update_forPaging_state(state);
		});
	}

	destructor() {
		this.child_cluster_maps.forEach(l => l.destructor());
		this.parent_cluster_maps.forEach(l => l.destructor());
	}

	get cluster_maps(): Array<Cluster_Map> { return u.concatenateArrays(this.parent_cluster_maps, this.child_cluster_maps); }		// for lines and arcs
	cluster_maps_forChildren(children: boolean): Array<Cluster_Map> { return children ? this.child_cluster_maps : this.parent_cluster_maps; }
	cluster_map_forChildren(children: boolean, predicate: Predicate): Cluster_Map { return this.cluster_maps_forChildren(children)[predicate.stateIndex]; }

	widget_mapFor(ancestry: Ancestry): Widget_MapRect | null {
		const maps = this.widget_maps.filter(m => m.widget_ancestry == ancestry);
		return maps.length > 0 ? maps[0] : null;
	}

	get widget_maps(): Array<Widget_MapRect> {
		const tools_ancestry = get(s_ancestry_showing_tools);
		let widget_maps: Array<Widget_MapRect> = [];
		this.tools_widget_map = null;
		for (const cluster_map of this.cluster_maps) {
			if (!!cluster_map) {
				for (const widget_map of cluster_map.widget_maps) {
					// set aside tools_ancestry map, it's widget needs to be drawn last
					if (widget_map.widget_ancestry == tools_ancestry) {
						this.tools_widget_map = widget_map;
					} else {
						widget_maps.push(widget_map);
					}
				}
			}
		}
		return widget_maps;		
	}

	get cluster_mapFor_mouseLocation(): Cluster_Map | null {
		for (const cluster_map of this.cluster_maps) {
			if (!!cluster_map && cluster_map.thumb_isHit) {
				return cluster_map;
			}
		}
		return null;
	}

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, children: boolean) {
		if (!!predicate) {
			const paging_state = get(s_focus_ancestry)?.thing?.page_states?.paging_state_forPointsOut(children, predicate);
			const onePage = paging_state?.onePage_from(ancestries) ?? [];
			const cluster_map = new Cluster_Map(ancestries.length, onePage, predicate, children);
			const cluster_maps = this.cluster_maps_forChildren(children);
			cluster_maps[predicate.stateIndex] = cluster_map;
		}
	}

	parent_ancestries_maybeFor(focus: Thing, predicate: Predicate): Array<Ancestry> {
		let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
		if (predicate.id == Predicate.idContains) {
			ancestries = ancestries.map(a => new Parent_Ancestry(a));
		}
		return ancestries;
	}

	layoutAll_clusters() {
		this.destructor();
		const ancestry = get(s_focus_ancestry);
		const focus = ancestry.thing;
		let childAncestries = ancestry.childAncestries;
		this.layout_clusterFor(childAncestries, Predicate.contains, true);
		if (!!focus) {
			for (const predicate of get(s_hierarchy).predicates) {
				let ancestries = this.parent_ancestries_maybeFor(focus, predicate);
				this.layout_clusterFor(ancestries, predicate, false);
			}
		}
	}

	update_forPaging_state(paging_state: Paging_State) {
		const ancestry = get(s_focus_ancestry);
		if (!!paging_state && !!ancestry) {
			if (paging_state.toChildren) {
				let childAncestries = ancestry.childAncestries;
				this.layout_clusterFor(childAncestries, Predicate.contains, true);
			} else {
				const focus = ancestry.thing;
				if (!!focus) {
					for (const predicate of get(s_hierarchy).predicates) {
						let ancestries = focus.uniqueAncestries_for(predicate) ?? [];
						this.layout_clusterFor(ancestries, predicate, false);
					}
				}
			}
		}	
	}

}