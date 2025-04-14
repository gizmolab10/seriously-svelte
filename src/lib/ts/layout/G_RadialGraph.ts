import { u, ux, Angle, Ancestry, Predicate } from '../common/Global_Imports';
import { w_hierarchy, w_s_paging, w_ancestry_focus } from '../common/Stores';
import { G_Widget, G_Cluster, S_Paging } from '../common/Global_Imports';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class G_RadialGraph {
	g_parent_clusters: Dictionary<G_Cluster> = {};		// includes related
	g_child_clusters: Dictionary<G_Cluster> = {};
	ancestry_focus!: Ancestry;

	constructor() {
		w_s_paging.subscribe((state: S_Paging) => {
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
			this.layout_clusterFor(childAncestries, Predicate.contains, true);
			if (!!focus_thing) {
				for (const predicate of get(w_hierarchy).predicates) {
					const ancestries = focus_thing.uniqueAncestries_for(predicate);
					this.layout_clusterFor(ancestries, predicate, false);
				}
			}
		}
	}

	get g_clusters(): Array<G_Cluster> { return u.concatenateArrays(Object.values(this.g_parent_clusters), Object.values(this.g_child_clusters)); }

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

	s_paging_forPredicate_toChildren(predicate: Predicate, points_toChildren: boolean): S_Paging | null {
		const s_thing_pages = ux.s_thing_pages_forThingID(get(w_ancestry_focus)?.thing?.id);
		return s_thing_pages?.s_paging_forPredicate_toChildren(predicate, points_toChildren) ?? null;
	}

	layout_clusterFor(ancestries: Array<Ancestry>, predicate: Predicate | null, points_toChildren: boolean) {
		if (!!predicate && ancestries.length > 0) {
			const angle_ofFork = predicate.angle_ofFork_when(points_toChildren);
			const points_right = new Angle(angle_ofFork).angle_pointsRight;
			const g_cluster = this.g_cluster_forPredicate_toChildren(predicate, points_toChildren);
			const s_paging = this.s_paging_forPredicate_toChildren(predicate, points_toChildren);
			const onePage_ofAncestries = s_paging?.onePage_from(ancestries) ?? [];
			const corrected_ancestries = points_right ? onePage_ofAncestries.reverse() : onePage_ofAncestries;			// reverse order for fork angle points left
			g_cluster.layout_cluster_forAncestries(ancestries.length, corrected_ancestries);
		}
	}

	g_cluster_forPredicate_toChildren(predicate: Predicate, points_toChildren: boolean) : G_Cluster {
		const g_clusters = points_toChildren ? this.g_child_clusters : this.g_parent_clusters;;
		let g_cluster = g_clusters[predicate.kind];
		if (!g_cluster) {
			g_cluster = new G_Cluster(predicate, points_toChildren);
			g_clusters[predicate.kind] = g_cluster;
		}
		return g_cluster;
	}

	layout_forPaging_state(s_paging: S_Paging) {
		const focus_ancestry = get(w_ancestry_focus);
		if (!!focus_ancestry) {
			if (!!s_paging && s_paging.points_toChildren) {
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