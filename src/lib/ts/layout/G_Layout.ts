import { h, k, p, u, w, grabs, Rect, Point, debug, signals, Ancestry } from '../common/Global_Imports';
import { T_Graph, T_Banner, T_Kinship, T_Preference, G_RadialGraph } from '../common/Global_Imports';
import { w_user_graph_offset, w_user_graph_center } from '../common/Stores';
import { w_show_tree_ofType, w_show_graph_ofType } from '../common/Stores';
import { w_show_related, w_ancestry_focus } from '../common/Stores';
import { w_graph_rect, w_show_details } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Layout {
	parents_focus_ancestry!: Ancestry;
	branches_visited: string[] = [];
	_g_radialGraph!: G_RadialGraph;
	tops_ofBanners: number[] = [];
	focus_ancestry!: Ancestry;

	get graph_top(): number { return this.banner_height + 17; }
	get banner_height(): number { return u.device_isMobile ? 32 : 16; }
	get breadcrumbs_height(): number { return this.banner_height + 14; }
	get inTreeMode(): boolean { return get(w_show_graph_ofType) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_show_graph_ofType) == T_Graph.radial; }
	get breadcrumbs_top(): number { return w.windowSize.height - this.breadcrumbs_height; }
	get isAllExpanded(): boolean { return h.rootAncestry?.isAllProgeny_expanded ?? false; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }
	get center_ofGraphSize(): Point { return get(w_graph_rect).size.asPoint.dividedInHalf; }
	top_ofBannerAt(index: number) { return this.tops_ofBanners[index] + k.thickness.separator.thick; }
	renormalize_user_graph_offset() { this.user_graph_offset_setTo(this.persisted_user_offset); }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	height_ofBannerAt(index: number) { return Object.values(k.height.banner)[index]; }
	expandAll() { h.rootAncestry.traverse(ancestry => ancestry.expand()); }

	ancestry_place_atCenter(ancestry: Ancestry | null) {
		if (!ancestry) {	
			ancestry = h.rootAncestry;
		}
		const wrapper = ancestry.titleWrapper;
		if (!!wrapper) {
			const rect = wrapper.boundingRect;
			const center = rect.center;
		}
	}

	grand_build() {
		this.grand_layout();
		signals.signal_rebuildGraph_fromFocus();
	}

	grand_layout() {
		if (this.inRadialMode) {
			this.g_radialGraph.grand_layout_radial();
		} else {
			get(w_ancestry_focus)?.g_widget.layout_entireTree();
		}
		signals.signal_reposition_widgets_fromFocus();
	}
	
	handle_mode_selection(name: string, types: string[]) {
		switch (name) {
			case 'graph': w_show_graph_ofType.set(types[0] as T_Graph); break;
			case 'tree': this.set_t_tree(types as Array<T_Kinship>); break;
		}
	}

	was_visited(ancestry: Ancestry, clear: boolean = false): boolean {
		if (clear) {
			this.branches_visited = [];	// null clears the array
		}
		const visited = this.branches_visited.includes(ancestry.id);
		if (!visited) {
			this.branches_visited.push(ancestry.id);
		}
		return visited;
	}
	
	toggle_t_graph() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree: w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree); break;
		}
		this.grand_build();
	}
	
	layout_tops_forPanelBanners() {
		const banner_height = u.device_isMobile ? 32 : 16;
		const banner_height_crumbs = banner_height + 12;
		const crumbs_top = w.windowSize.height - banner_height_crumbs - 600;
		let index = 0;
		let top = 2;
		while (index <= T_Banner.graph) {
			this.tops_ofBanners[index] = top;
			top += banner_height + 4;
			index += 1;
		}
		this.tops_ofBanners[T_Banner.crumbs] = crumbs_top;
	}

	set_t_tree(t_trees: Array<T_Kinship>) {
		if (t_trees.length == 0) {
			t_trees = [T_Kinship.child];
		}
		w_show_tree_ofType.set(t_trees);
		let focus_ancestry = get(w_ancestry_focus);
		if (p.branches_areChildren) {
			this.parents_focus_ancestry = focus_ancestry;
			focus_ancestry = this.focus_ancestry;
		} else {
			this.focus_ancestry = focus_ancestry;
			focus_ancestry = this.parents_focus_ancestry ?? grabs.latest;
		}
		w_show_related.set(t_trees.includes(T_Kinship.related));
		focus_ancestry?.becomeFocus();
		p.restore_expanded();
		this.grand_build();
	}

	get persisted_user_offset(): Point {
		const point = p.read_key(T_Preference.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}

	user_graph_offset_setTo(user_offset: Point): boolean {
		let changed = false;
		const current_offset = get(w_user_graph_offset);
		if (!!current_offset && current_offset.vector_to(user_offset).magnitude > .001) {
			p.write_key(T_Preference.user_offset, user_offset);
			changed = true;
		}
		const center_offset = get(w_graph_rect).center.offsetBy(user_offset);
		w_user_graph_center.set(center_offset);
		w_user_graph_offset.set(user_offset);
		debug.log_mouse(`USER ====> ${user_offset.verbose}  ${center_offset.verbose}`);
		return changed;
	}

	graphRect_update() {
		const y = this.graph_top;
		const x = get(w_show_details) ? k.width_details : 0;
		const origin_ofGraph = new Point(x, y);
		const size_ofGraph = w.windowSize.reducedBy(origin_ofGraph).reducedByXY(0, this.breadcrumbs_height);	// account for origin and crumbs
		const rect = new Rect(origin_ofGraph, size_ofGraph);
		debug.log_mouse(`GRAPH ====> ${rect.description}`);
		w_graph_rect.set(rect);											// used by Panel and Graph_Tree
	}

}

export let layout = new G_Layout();