import { G_Widget, G_Cluster, S_Paging, T_GraphMode } from '../common/Global_Imports';
import { u, ux, Thing, Point, Ancestry, Predicate } from '../common/Global_Imports';
import { w_hierarchy, w_s_paging, w_ancestry_focus } from '../common/Stores';
import Reciprocal_Ancestry from '../data/runtime/Reciprocal_Ancestry';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class G_RadialGraph {
	g_parent_clusters: Dictionary<G_Cluster> = {};		// includes related
	g_child_clusters: Dictionary<G_Cluster> = {};
	ancestry_focus!: Ancestry;

	constructor() {
		w_s_paging.subscribe((state: S_Paging) => {
			this.update_forPaging_state(state);
		});
	}

	destructor() {
		Object.values(this.g_parent_clusters).forEach(cluster => cluster.destructor());
		Object.values(this.g_child_clusters).forEach(cluster => cluster.destructor());
		this.g_parent_clusters = {};
		this.g_child_clusters = {};
	}

	//////////////////////////////////////////////////
	// layout widgets, cluster lines, & paging arcs //
	//////////////////////////////////////////////////

	layout_allClusters() {
		this.destructor();
		const focus_ancestry = get(w_ancestry_focus);
		const focus_thing = focus_ancestry.thing;
		let childAncestries = focus_ancestry.childAncestries;
		focus_ancestry.g_widget.update(T_GraphMode.radial, Point.zero);
		this.layout_clusterFor(childAncestries, Predicate.contains, true);
		if (!!focus_thing) {
			for (const predicate of get(w_hierarchy).predicates) {
				let reciprocal_ancestries = this.reciprocal_ancestries_maybeFor(focus_thing, predicate);
				this.layout_clusterFor(reciprocal_ancestries, predicate, false);
			}
		}
	}

	get g_clusters(): Array<G_Cluster> { return u.concatenateArrays(Object.values(this.g_parent_clusters), Object.values(this.g_child_clusters)); }
	g_clusters_pointing_toChildren(toChildren: boolean): Dictionary<G_Cluster> { return toChildren ? this.g_child_clusters : this.g_parent_clusters; }
	g_cluster_pointing_toChildren(toChildren: boolean, predicate: Predicate): G_Cluster { return this.g_clusters_pointing_toChildren(toChildren)[predicate.kind]; }

	get g_cluster_atMouseLocation(): G_Cluster | null {
		for (const g_cluster of this.g_clusters) {
			if (!!g_cluster && g_cluster.thumb_isHit) {
				return g_cluster;
			}
		}
		return null;
	}

	get g_necklace_widgets(): Array<G_Widget> {
		let array: Array<G_Widget> = [];
		for (const g_cluster of this.g_clusters) {
			if (!!g_cluster) {
				for (const g_cluster_widget of g_cluster.g_cluster_widgets) {
					array.push(g_cluster_widget);
				}
			}
		}
		return array;		
	}

	reciprocal_ancestries_maybeFor(focus: Thing, predicate: Predicate): Array<Ancestry> {
		let ancestries = focus.uniqueAncestries_for(predicate);
		if (predicate.isBidirectional) {
			ancestries = ancestries.map(a => new Reciprocal_Ancestry(a));
		}
		return ancestries;
	}

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, points_toChildren: boolean) {
		if (!!predicate) {
			const s_thing_pages = ux.s_thing_pages_forThingID(get(w_ancestry_focus)?.thing?.id);
			const s_paging = s_thing_pages?.s_paging_pointingToChildren(points_toChildren, predicate);
			const onePageOf_ancestries = s_paging?.onePage_from(ancestries) ?? [];
			const g_cluster = new G_Cluster(ancestries.length, onePageOf_ancestries, predicate, points_toChildren);
			const g_clusters = this.g_clusters_pointing_toChildren(points_toChildren);
			g_clusters[predicate.kind] = g_cluster;
		}
	}

	update_forPaging_state(s_paging: S_Paging) {
		const focus_ancestry = get(w_ancestry_focus);
		if (!!s_paging && !!focus_ancestry) {
			if (s_paging.points_toChildren) {
				let childAncestries = focus_ancestry.childAncestries;
				this.layout_clusterFor(childAncestries, Predicate.contains, true);
			} else {
				const focus_thing = focus_ancestry.thing;
				if (!!focus_thing) {
					for (const predicate of get(w_hierarchy).predicates) {
						let ancestries = focus_thing.uniqueAncestries_for(predicate) ?? [];
						this.layout_clusterFor(ancestries, predicate, false);
					}
				}
			}
		}	
	}

}