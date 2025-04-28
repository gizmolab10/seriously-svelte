import { w_hierarchy, w_g_paging, w_ancestry_focus, w_ring_rotation_radius } from '../common/Stores';
import { k, u, Angle, radial, Ancestry, Predicate } from '../common/Global_Imports';
import { G_Widget, G_Cluster, G_Paging } from '../common/Global_Imports';
import type { Integer, Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class G_RadialGraph {
	g_parent_clusters: Dictionary<G_Cluster> = {};		// includes related
	g_child_clusters: Dictionary<G_Cluster> = {};
	ancestry_focus!: Ancestry;

	constructor() {
		w_g_paging.subscribe((state: G_Paging) => {
			this.layout_forPaging_state(state);
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

	grand_layout_radial() {
		this.destructor();
		const focus_ancestry = get(w_ancestry_focus);
		if (!!focus_ancestry) {
			const focus_thing = focus_ancestry.thing;
			let childAncestries = focus_ancestry.childAncestries;
			this.assignAncestries_toClusterFor(childAncestries, Predicate.contains, true);
			if (!!focus_thing) {
				for (const predicate of get(w_hierarchy).predicates) {
					const ancestries = focus_thing.uniqueAncestries_for(predicate);
					this.assignAncestries_toClusterFor(ancestries, predicate, false);
				}
			}
			this.apportion_widgets_amongClusters();
		}
	}

	get g_clusters(): Array<G_Cluster> {
		return u.concatenateArrays(Object.values(this.g_parent_clusters), Object.values(this.g_child_clusters));
	}

	get g_clusters_forPaging(): Array<G_Cluster> {
		return this.g_clusters.filter(cluster => cluster.ancestries.length > 0);
	}

	get total_ancestries(): number {
		return this.g_clusters.reduce((sum, cluster) => sum + cluster.total_widgets, 0);
	}

	get g_cluster_atMouseLocation(): G_Cluster | null {
		for (const g_cluster of this.g_clusters) {
			if (g_cluster.isMouse_insideThumb) {
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

	private apportion_widgets_amongClusters() {
		let remaining_toShow = Math.floor(get(w_ring_rotation_radius) * 4 / k.height.row)
		if (this.total_ancestries > remaining_toShow) {
			let clusters = this.g_clusters_forPaging;
			clusters.sort((a, b) => a.total_widgets - b.total_widgets);		// sort clusters by widgets count, smallest first
			while (clusters.length > 0 && remaining_toShow > 0) {
				const portion = Math.ceil(remaining_toShow / clusters.length);			// divide total by three to get the portion
				const cluster = clusters[0];
				let show = portion;						// remove these unless...
				if (cluster.total_widgets < portion) {
					show = cluster.total_widgets;		// show all its widgets and subtract from remaining
				}
				remaining_toShow -= show;
				cluster.widgets_shown = show;
				clusters.shift();						// Remove this cluster from consideration
			}
		}
		for (const cluster of this.g_clusters_forPaging) {
			cluster.layout_forPaging();
		}
	}

	private assignAncestries_toClusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, points_toChildren: boolean) {
		if (!!predicate) {
			const g_cluster = this.g_cluster_forPredicate_toChild(predicate, points_toChildren);
			g_cluster.setAncestries(ancestries);
		}
	}

	private g_cluster_forPredicate_toChild(predicate: Predicate, points_toChildren: boolean) : G_Cluster {
		const g_clusters = points_toChildren ? this.g_child_clusters : this.g_parent_clusters;;
		let g_cluster = g_clusters[predicate.kind];
		if (!g_cluster) {
			g_cluster = new G_Cluster(predicate, points_toChildren);
			g_clusters[predicate.kind] = g_cluster;
		}
		return g_cluster;
	}

	private layout_forPaging_state(g_paging: G_Paging) {
		const focus_ancestry = get(w_ancestry_focus);
		if (!!focus_ancestry) {
			if (!!g_paging && g_paging.points_toChildren) {
				let childAncestries = focus_ancestry.childAncestries;
				this.assignAncestries_toClusterFor(childAncestries, Predicate.contains, true);
			} else {
				const focus_thing = focus_ancestry.thing;
				if (!!focus_thing) {
					for (const predicate of get(w_hierarchy).predicates) {
						const ancestries = focus_thing.uniqueAncestries_for(predicate) ?? [];
						this.assignAncestries_toClusterFor(ancestries, predicate, false);
					}
				}
			}
			this.apportion_widgets_amongClusters();
		}	
	}

}