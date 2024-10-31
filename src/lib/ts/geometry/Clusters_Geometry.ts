import { s_hierarchy, s_paging_state, s_focus_ancestry } from '../state/Reactive_State';
import { u, get, Thing, debug, Ancestry, Predicate } from '../common/Global_Imports';
import { Cluster_Map, Paging_State, Widget_MapRect } from '../common/Global_Imports';
import Parent_Ancestry from '../managers/Parent_Ancestry';

export default class Clusters_Geometry {
	outward_cluster_maps: Array<Cluster_Map> = [];
	inward_cluster_maps: Array<Cluster_Map> = [];
	ancestry_focus!: Ancestry;

	// layout all the widgets, rings and arcs

	constructor() {
		debug.log_layout(`GEOMETRY (ts)  ${get(s_focus_ancestry)?.thing?.title}`);
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
	cluster_maps_for(toChildren: boolean): Array<Cluster_Map> { return toChildren ? this.outward_cluster_maps : this.inward_cluster_maps; }
	cluster_map_for(toChildren: boolean, predicate: Predicate): Cluster_Map { return this.cluster_maps_for(toChildren)[predicate.stateIndex]; }

	widget_mapFor(ancestry: Ancestry): Widget_MapRect | null {
		const maps = this.widget_maps.filter(m => m.childAncestry == ancestry);
		return maps.length > 0 ? maps[0] : null;
	}

	get widget_maps(): Array<Widget_MapRect> {
		let widget_maps: Array<Widget_MapRect> = [];
		for (const map of this.cluster_maps) {
			if (!!map) {
				widget_maps = u.concatenateArrays(widget_maps, map.widget_maps);
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

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, toChildren: boolean) {
		if (!!predicate) {
			const paging_state = get(s_focus_ancestry)?.thing?.page_states?.paging_state_forPointsOut(toChildren, predicate);
			const onePage = paging_state?.onePage_from(ancestries) ?? [];
			const cluster_map = new Cluster_Map(ancestries.length, onePage, predicate, toChildren);
			const cluster_maps = this.cluster_maps_for(toChildren);
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