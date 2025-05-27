import { k, p, u, grabs, signals, Ancestry, G_RadialGraph } from '../common/Global_Imports';
import { T_Graph, T_Banner, T_Kinship } from '../common/Global_Imports';
import { w_show_tree_ofType, w_show_graph_ofType, w_hierarchy } from '../common/Stores';
import { w_show_related, w_ancestry_focus } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Layout {
	branches_visited: Array<string> = [];
	tops_ofBanners: Array<number> = [];
	parents_focus_ancestry!: Ancestry;
	_g_radialGraph!: G_RadialGraph;
	focus_ancestry!: Ancestry;

	get inTreeMode(): boolean { return get(w_show_graph_ofType) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_show_graph_ofType) == T_Graph.radial; }
	height_ofBannerAt(index: number) { return Object.values(k.height.banner)[index]; }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	expandAll() { get(w_hierarchy).rootAncestry.traverse(ancestry => ancestry.expand()); }
	top_ofBannerAt(index: number) { return this.tops_ofBanners[index] + k.thickness.separator; }
	get isAllExpanded(): boolean { return get(w_hierarchy).rootAncestry.isAllProgeny_expanded; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }

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
	
	handle_mode_selection(name: string, types: Array<string>) {
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
		const heights = Object.values(k.height.banner);
		let index = 0;
		let top = 2;
		while (index <= T_Banner.graph) {
			this.tops_ofBanners[index] = top;
			top += heights[index] + 4;
			index += 1;
		}
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
			focus_ancestry = this.parents_focus_ancestry ?? grabs.latest_ancestry;
		}
		w_show_related.set(t_trees.includes(T_Kinship.related));
		focus_ancestry?.becomeFocus();
		p.restore_expanded();
		this.grand_build();
	}

}

export let layout = new G_Layout();