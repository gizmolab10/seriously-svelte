import { u, Thing, debug, Ancestry, Predicate, T_Predicate } from '../common/Global_Imports';
import { s_hierarchy, s_s_paging, s_ancestry_focus } from '../state/S_Stores';
import { G_Cluster, S_Paging, G_Widget } from '../common/Global_Imports';
import Parent_Ancestry from '../data/runtime/Parent_Ancestry';
import { get } from 'svelte/store';

export default class G_Radial {
	parent_g_clusters: Array<G_Cluster> = [];
	child_g_clusters: Array<G_Cluster> = [];
	ancestry_focus!: Ancestry;

	// layout all the widgets, radial and arcs

	constructor() {
		debug.log_layout(`GEOMETRY (ts)  ${get(s_ancestry_focus)?.thing?.title}`);
		this.layoutAll_clusters();
		s_s_paging.subscribe((state: S_Paging) => {
			this.update_forPaging_state(state);
		});
	}

	destructor() {
		this.child_g_clusters.forEach(l => l.destructor());
		this.parent_g_clusters.forEach(l => l.destructor());
	}

	get g_clusters(): Array<G_Cluster> { return u.concatenateArrays(this.parent_g_clusters, this.child_g_clusters); }		// for lines and arc sliders
	g_clusters_pointing_toChildren(toChildren: boolean): Array<G_Cluster> { return toChildren ? this.child_g_clusters : this.parent_g_clusters; }
	g_cluster_pointing_toChildren(toChildren: boolean, predicate: Predicate): G_Cluster { return this.g_clusters_pointing_toChildren(toChildren)[predicate.stateIndex]; }

	g_widget_forAncestry(ancestry: Ancestry): G_Widget | null {
		const g_widgets = this.g_widgets.filter(m => m.widget_ancestry?.hid == ancestry.hid);
		return g_widgets.length > 0 ? g_widgets[0] : null;
	}

	get g_widgets(): Array<G_Widget> {
		let g_widgets: Array<G_Widget> = [];
		for (const g_cluster of this.g_clusters) {
			if (!!g_cluster) {
				for (const g_widget of g_cluster.g_widgets) {
					g_widgets.push(g_widget);
				}
			}
		}
		return g_widgets;		
	}

	get g_clusterFor_mouseLocation(): G_Cluster | null {
		for (const g_cluster of this.g_clusters) {
			if (!!g_cluster && g_cluster.thumb_isHit) {
				return g_cluster;
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
			const s_paging = get(s_ancestry_focus)?.thing?.s_pages?.s_paging_forPointingTo(points_toChildren, predicate);
			const onePageOf_ancestries = s_paging?.onePage_from(ancestries) ?? [];
			const g_cluster = new G_Cluster(ancestries.length, onePageOf_ancestries, predicate, points_toChildren);
			const g_clusters = this.g_clusters_pointing_toChildren(points_toChildren);
			g_clusters[predicate.stateIndex] = g_cluster;
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

	update_forPaging_state(s_paging: S_Paging) {
		const focus_ancestry = get(s_ancestry_focus);
		if (!!s_paging && !!focus_ancestry) {
			if (s_paging.points_toChildren) {
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