import { h, k, u, Rect, Size, Point, radial, Ancestry, Predicate } from '../common/Global_Imports';
import { G_Widget, G_Cluster, G_Paging, T_Kinship } from '../common/Global_Imports';
import { w_ring_rotation_angle, w_ring_rotation_radius } from '../managers/Stores';
import { w_g_paging, w_graph_rect, w_ancestry_focus } from '../managers/Stores';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export default class G_RadialGraph {
	g_parent_clusters: Dictionary<G_Cluster> = {};		// includes related
	g_child_clusters: Dictionary<G_Cluster> = {};
	rect_ofNecklace!: Rect;

	constructor() {
		w_g_paging.subscribe((g_paging: G_Paging | null) => {
			if (!!g_paging) {
				this.layout_forPoints_toChildren(g_paging.points_toChildren);
				this.layout_forPaging();
			}
		});
		setTimeout(() => {	// must wait for Rect to become available
			w_ring_rotation_radius.subscribe(() => {
				this.update_rect_ofNecklace();
			});
			w_ring_rotation_angle.subscribe(() => {
				this.update_rect_ofNecklace();
			});
		}, 2);
	}

	destructor() {
		Object.values(this.g_parent_clusters).forEach(cluster => cluster.destructor());
		Object.values(this.g_child_clusters).forEach(cluster => cluster.destructor());
		this.g_parent_clusters = {};
		this.g_child_clusters = {};
	}

	static readonly _____LAYOUT: unique symbol;

	//////////////////////////////////////////////////
	// layout widgets, cluster lines, & paging arcs //
	//////////////////////////////////////////////////

	grand_layout_radial() {
		this.destructor();
		get(w_ancestry_focus)?.g_widget.layout_widget()
		this.layout_forPoints_toChildren(true);
		this.layout_forPoints_toChildren(false);
		this.layout_forPaging();
		this.update_rect_ofNecklace();
	}

	private layout_forPoints_toChildren(points_toChildren: boolean) {
		const focus_ancestry = get(w_ancestry_focus);
		if (!!focus_ancestry) {
			if (points_toChildren) {
				let childAncestries = focus_ancestry.ancestries_createUnique_byKinship(T_Kinship.children);
				this.assignAncestries_toClusterFor(childAncestries, Predicate.contains, true);
			} else {
				for (const predicate of h?.predicates) {
					const ancestries = focus_ancestry.ancestries_createUnique_byKinship(predicate.kinship_forPoints_toChildren(false));
					this.assignAncestries_toClusterFor(ancestries, predicate, false);
				}
			}
		}	
	}

	static readonly _____CLUSTERS: unique symbol;

	get g_clusters(): Array<G_Cluster> {
		return u.concatenateArrays(Object.values(this.g_parent_clusters), Object.values(this.g_child_clusters));
	}

	get g_clusters_forPaging(): Array<G_Cluster> {
		return this.g_clusters.filter(cluster => cluster.ancestries.length > 0);
	}

	get g_cluster_atMouseLocation(): G_Cluster | null {
		for (const g_cluster of this.g_clusters) {
			if (g_cluster.isMouse_insideThumb) {
				return g_cluster;
			}
		}
		return null;
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

	static readonly _____ANCESTRIES: unique symbol;

	get total_ancestries(): number {
		return this.g_clusters.reduce((sum, cluster) => sum + cluster.total_widgets, 0);
	}

	private assignAncestries_toClusterFor(ancestries: Array<Ancestry> | null, predicate: Predicate | null, points_toChildren: boolean) {
		if (!!predicate && !!ancestries) {
			const g_cluster = this.g_cluster_forPredicate_toChild(predicate, points_toChildren);
			g_cluster.setAncestries(ancestries);
			for (const ancestry of ancestries) {
				ancestry.g_widget.g_cluster = g_cluster;
			}
		}
	}

	static readonly _____NECKLACE: unique symbol;

	update_rect_ofNecklace() {
		this.rect_ofNecklace = get(w_graph_rect).centeredRect_ofSize(this.size_ofNecklace);
	}

	get size_ofNecklace(): Size {
		const widgets = this.g_necklace_widgets;
		if (widgets.length === 0) {
			return Size.zero;
		}
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const widget of widgets) {
			const widgetOrigin = widget.origin_ofWidget.offsetBy(widget.offset_ofWidget);
			const widgetWidth = widget.width_ofWidget;
			const widgetHeight = k.height.row - 1.5;
			const widgetMinX = widgetOrigin.x;
			const widgetMinY = widgetOrigin.y;
			const widgetMaxX = widgetOrigin.x + widgetWidth;
			const widgetMaxY = widgetOrigin.y + widgetHeight;
			minX = Math.min(minX, widgetMinX);
			minY = Math.min(minY, widgetMinY);
			maxX = Math.max(maxX, widgetMaxX);
			maxY = Math.max(maxY, widgetMaxY);
		}
		const width = maxX - minX;
		const height = maxY - minY;
		return new Size(width, height);
	}

	get g_necklace_widgets(): Array<G_Widget> {
		let array: Array<G_Widget> = [];
		for (const g_cluster of this.g_clusters) {
			if (!!g_cluster) {
				for (const g_cluster_widget of g_cluster.g_widgets_inCluster) {
					array.push(g_cluster_widget);
				}
			}
		}
		return array;
	}

	static readonly _____PAGING: unique symbol;

	g_paging_forPredicate_toChildren(predicate: Predicate, points_toChildren: boolean): G_Paging | null {
		const s_thing_pages = radial.s_thing_pages_forThingID(get(w_ancestry_focus)?.thing?.id);
		return s_thing_pages?.g_paging_forPredicate_toChildren(predicate, points_toChildren) ?? null;
	}

	private layout_forPaging() {
		let remaining_toShow = Math.ceil((get(w_ring_rotation_radius) ** 1.5) / k.height.row);
		const angle_per_widget = 40 / get(w_ring_rotation_radius);			// Limit show so arc spread never exceeds 180°
		const maximum_portion = Math.floor(Math.PI / angle_per_widget);
		if (this.total_ancestries > remaining_toShow || this.total_ancestries > maximum_portion) {
			let clusters = this.g_clusters_forPaging;
			clusters.sort((a, b) => a.total_widgets - b.total_widgets);		// sort clusters by widgets count, smallest first
			while (clusters.length > 0 && remaining_toShow > 0) {
				const portion = Math.min(Math.ceil(remaining_toShow / clusters.length), maximum_portion);
				const cluster = clusters[0];
				const show = Math.min(portion, cluster.total_widgets);
				remaining_toShow -= show;
				cluster.widgets_shown = show;
				clusters.shift();
			}
		}
		for (const g_cluster of this.g_clusters_forPaging) {
			g_cluster.layout_forPaging();
		}
	}

}

export let g_radial = new G_RadialGraph();
