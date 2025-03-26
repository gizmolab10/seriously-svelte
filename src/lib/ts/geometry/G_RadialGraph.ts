import { u, ux, Thing, Point, Angle, Ancestry, Predicate } from '../common/Global_Imports';
import { G_Widget, G_Cluster, S_Paging, T_GraphMode } from '../common/Global_Imports';
import { w_hierarchy, w_s_paging, w_ancestry_focus } from '../common/Stores';
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
				if (predicate.isBidirectional) {
					let reciprocal_ancestries = focus_thing.reciprocal_ancestries_forPredicate(predicate);
					this.layout_clusterFor(reciprocal_ancestries, predicate, false);
				} else {
					const ancestries = focus_thing.uniqueAncestries_for(predicate);
					this.layout_clusterFor(ancestries, predicate, false);
				}
			}
		}
	}

	get g_clusters(): Array<G_Cluster> { return u.concatenateArrays(Object.values(this.g_parent_clusters), Object.values(this.g_child_clusters)); }
	g_clusters_pointing_toChildren(toChildren: boolean): Dictionary<G_Cluster> { return toChildren ? this.g_child_clusters : this.g_parent_clusters; }
	g_cluster_pointing_toChildren(toChildren: boolean, predicate: Predicate): G_Cluster { return this.g_clusters_pointing_toChildren(toChildren)[predicate.kind]; }

	get g_cluster_atMouseLocation(): G_Cluster | null {
		for (const g_cluster of this.g_clusters) {
			if (g_cluster.thumb_isHit) {
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

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, points_toChildren: boolean) {
		if (!!predicate && ancestries.length > 0) {
			const angle_ofFork = predicate.angle_ofFork_when(points_toChildren);
			const points_right = new Angle(angle_ofFork).angle_pointsRight;
			const s_thing_pages = ux.s_thing_pages_forThingID(get(w_ancestry_focus)?.thing?.id);
			const s_paging = s_thing_pages?.s_paging_pointingToChildren(points_toChildren, predicate);
			const onePage_ofAncestries = s_paging?.onePage_from(ancestries) ?? [];
			const corrected_ancestries = points_right ? onePage_ofAncestries.reverse() : onePage_ofAncestries;			// reverse order for fork angle points left
			const g_cluster = new G_Cluster(ancestries.length, corrected_ancestries, predicate, points_toChildren);
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
						const ancestries = focus_thing.uniqueAncestries_for(predicate) ?? [];
						this.layout_clusterFor(ancestries, predicate, false);
					}
				}
			}
		}	
	}

}