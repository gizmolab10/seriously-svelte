import { T_Info, T_Graph, T_Banner, T_Details, T_Kinship, T_Preference } from '../common/Global_Imports';
import { c, k, p, u, debug, signals, Ancestry, G_RadialGraph } from '../common/Global_Imports';
import { w_t_tree, w_t_graph, w_t_details, w_hierarchy, w_t_database } from '../common/Stores';
import { w_show_related, w_ancestry_focus, w_ancestries_expanded } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Common {
	branches_visited: Array<string> = [];
	tops_ofBanners: Array<number> = [];
	tops_ofDetails: Array<number> = [];
	parents_focus_ancestry!: Ancestry;
	tops_ofInfo: Array<number> = [];
	_g_radialGraph!: G_RadialGraph;
	focus_ancestry!: Ancestry;

	get branches_areChildren(): boolean { return true; }
	top_ofInfoAt(index: number) { return this.tops_ofInfo[index]; }
	get inTreeMode(): boolean { return get(w_t_graph) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_t_graph) == T_Graph.radial; }
	height_ofBannerAt(index: number) { return Object.values(k.height.banner)[index]; }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	top_ofBannerAt(index: number) { return this.tops_ofBanners[index] + k.thickness.separator; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }
	get focus_key(): string { return this.branches_areChildren ? T_Preference.focus_forChildren : T_Preference.focus_forParents; }
	get expanded_key(): string { return this.branches_areChildren ? T_Preference.expanded_children : T_Preference.expanded_parents; }

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
			case 'graph': w_t_graph.set(types[0] as T_Graph); break;
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
		switch (get(w_t_graph)) {
			case T_Graph.tree: w_t_graph.set(T_Graph.radial); break;
			case T_Graph.radial: w_t_graph.set(T_Graph.tree); break;
		}
		this.grand_build();
	}
		
	layout_tops_forInfo(start: number) {
		let top = start;
		for (let i = 0; i <= T_Info.quest; i++) {
			const height = u.valueFrom_atIndex(k.height.info, i);
			this.tops_ofInfo[i] = top;
			top += height;
		}
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
	
	layout_tops_forDetails() {
		let top = this.top_ofBannerAt(T_Banner.crumbs) + 8;
		const heights = Object.values(k.height.detail);
		let index = 0;
		let indices = get(w_t_details);
		while (index <= T_Details.info) {
			this.tops_ofDetails[index] = top;
			const t_detail = T_Details[index] as unknown as T_Details;
			if (indices.includes(t_detail)) {
				top += heights[index];
			}
			index += 1;
		}
	}

	set_t_tree(t_trees: Array<T_Kinship>) {
		if (t_trees.length == 0) {
			t_trees = [T_Kinship.child];
		}
		w_t_tree.set(t_trees);
		let focus_ancestry = get(w_ancestry_focus);
		if (this.branches_areChildren) {
			this.parents_focus_ancestry = focus_ancestry;
			focus_ancestry = this.focus_ancestry;
		} else {
			this.focus_ancestry = focus_ancestry;
			focus_ancestry = this.parents_focus_ancestry ?? get(w_hierarchy).grabs_latest_ancestry;
		}
		w_show_related.set(t_trees.includes(T_Kinship.related));
		focus_ancestry?.becomeFocus();
		this.restore_expanded();
		this.grand_build();
	}
		
	restore_expanded() {
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			w_ancestries_expanded.set([]);
		} else {
			const expanded = p.ancestries_readDB_key(this.expanded_key) ?? p.ancestries_readDB_key('expanded');	// backwards compatible with 'expanded' key
			debug.log_expand(`  READ (${get(w_t_database)}): "${this.ids_forDB(expanded)}"`);
			w_ancestries_expanded.set(expanded);
		}
		setTimeout(() => {
			w_ancestries_expanded.subscribe((array: Array<Ancestry>) => {
				if (array.length > 0) {
					debug.log_expand(`  WRITING (${get(w_t_database)}): "${this.ids_forDB(array)}"`);
					p.ancestries_writeDB_key(array, this.expanded_key);
				}
			});
		}, 100);
	}

	restore_focus() {
		const h = get(w_hierarchy);
		let ancestryToFocus = h.rootAncestry;
		if (!p.ignoreAncestries && !c.eraseDB) {
			const key = this.branches_areChildren ? T_Preference.focus_forChildren : T_Preference.focus_forParents;
			const focusPath = p.readDB_key(this.focus_key) ?? p.readDB_key('focus');
			if (!!focusPath) {
				const focusAncestry = h.ancestry_remember_createUnique(focusPath);
				if (!!focusAncestry) {
					ancestryToFocus = focusAncestry;
				}
			}
		}
		if (!ancestryToFocus.thing) {
			const lastGrabbedAncestry = h.grabs_latest_ancestry?.parentAncestry;
			if (lastGrabbedAncestry) {
				ancestryToFocus = lastGrabbedAncestry;
			}
		}
		ancestryToFocus.becomeFocus(true);
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			p.writeDB_key(this.focus_key, !ancestry ? null : ancestry.pathString);
		});
	}

}

export let layout = new G_Common();