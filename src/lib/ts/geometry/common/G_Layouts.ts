import { k, signals, G_TreeGraph, G_RadialGraph } from '../../common/Global_Imports';
import { T_Graph, T_Banner, T_Hierarchy } from '../../common/Global_Imports';
import { w_t_tree, w_t_graph } from '../../common/Stores';
import { get } from 'svelte/store';

class Verticals {
	tops: Array<number> = [];
	heights: Array<number> = [];

	constructor(capacity: number) {
		this.tops = new Array(capacity).fill({} as number);
		this.heights = new Array(capacity).fill({} as number);
	}
}

export default class G_Layouts {
	_g_treeGraph!: G_TreeGraph;
	_g_radialGraph!: G_RadialGraph;
	verticals_ofBanners = new Verticals(3);

	get inTreeMode(): boolean { return get(w_t_graph) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_t_graph) == T_Graph.radial; }
	height_ofBannerAt(index: number) { return this.verticals_ofBanners.heights[index]; }
	top_ofBannerAt(index: number) { return this.verticals_ofBanners.tops[index] + k.separator_thickness; }
	get g_treeGraph() { let g = this._g_treeGraph; if (!g) { g = new G_TreeGraph(); this._g_treeGraph = g }; return g; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }

	grand_build() { signals.signal_rebuildGraph_fromFocus(); }
	
	handle_mode_selection(name: string, types: Array<string>) {
		const type = types[0];	// only ever has one element
		switch (name) {
			case 'graph': w_t_graph.set(type as T_Graph); break;
			case 'tree': w_t_tree.set(type as T_Hierarchy); break;
		}
	}
	
	toggle_graphMode() {
		switch (get(w_t_graph)) {
			case T_Graph.tree: w_t_graph.set(T_Graph.radial); break;
			case T_Graph.radial: w_t_graph.set(T_Graph.tree); break;
		}
		this.grand_build();
	}

	grand_layout() {
		if (this.inTreeMode) {
			this.g_treeGraph.grand_layout_tree();
		} else {
			this.g_radialGraph.grand_layout_radial();
		}
		signals.signal_reposition_widgets_fromFocus();
	}
	
	layout_tops_ofBanners() {
		this.verticals_ofBanners.heights = [k.row_height, k.row_height, k.row_height];
		let index = 0;
		let top = 0;
		while (index <= T_Banner.graph) {
			this.verticals_ofBanners.tops[index] = top;
			top += this.verticals_ofBanners.heights[index] + 1;
			index += 1;
		}
	}

}

export let layouts = new G_Layouts();