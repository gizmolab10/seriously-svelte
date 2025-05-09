import { E_Info, E_Graph, E_Banner, E_Details, E_Kinship, E_Preference } from '../common/Global_Imports';
import { c, k, p, u, debug, signals, Ancestry, G_RadialGraph } from '../common/Global_Imports';
import { w_e_tree, w_e_graph, w_e_details, w_hierarchy, w_e_database } from '../common/Stores';
import { w_show_related, w_ancestry_focus, w_ancestries_expanded } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Layout {
	branches_visited: Array<string> = [];
	tops_ofBanners: Array<number> = [];
	tops_ofDetails: Array<number> = [];
	parents_focus_ancestry!: Ancestry;
	tops_ofInfo: Array<number> = [];
	_g_radialGraph!: G_RadialGraph;
	focus_ancestry!: Ancestry;

	get branches_areChildren(): boolean { return true; }
	top_ofInfoAt(index: number) { return this.tops_ofInfo[index]; }
	get inTreeMode(): boolean { return get(w_e_graph) == E_Graph.tree; }
	get inRadialMode(): boolean { return get(w_e_graph) == E_Graph.radial; }
	height_ofBannerAt(index: number) { return Object.values(k.height.banner)[index]; }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	top_ofBannerAt(index: number) { return this.tops_ofBanners[index] + k.thickness.separator; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }
	get focus_key(): string { return this.branches_areChildren ? E_Preference.focus_forChildren : E_Preference.focus_forParents; }
	get expanded_key(): string { return this.branches_areChildren ? E_Preference.expanded_children : E_Preference.expanded_parents; }

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
			case 'graph': w_e_graph.set(types[0] as E_Graph); break;
			case 'tree': this.set_t_tree(types as Array<E_Kinship>); break;
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
		switch (get(w_e_graph)) {
			case E_Graph.tree: w_e_graph.set(E_Graph.radial); break;
			case E_Graph.radial: w_e_graph.set(E_Graph.tree); break;
		}
		this.grand_build();
	}
		
	layout_tops_forInfo(start: number) {
		let top = start;
		for (let i = 0; i <= E_Info.quest; i++) {
			const height = u.valueFrom_atIndex(k.height.info, i);
			this.tops_ofInfo[i] = top;
			top += height;
		}
	}
	
	layout_tops_forPanelBanners() {
		const heights = Object.values(k.height.banner);
		let index = 0;
		let top = 2;
		while (index <= E_Banner.graph) {
			this.tops_ofBanners[index] = top;
			top += heights[index] + 4;
			index += 1;
		}
	}
	
	layout_tops_forDetails() {
		let top = this.top_ofBannerAt(E_Banner.crumbs) + k.height.separator - 2;
		const heights = [
			k.height.detail.storage,
			k.height.detail.tools(),
			k.height.detail.display,
			k.height.detail.info
		];
		let index = 0;
		let indices = get(w_e_details);
		while (index <= E_Details.info) {
			this.tops_ofDetails[index] = top;
			const e_detail = E_Details[index] as unknown as E_Details;
			if (indices.includes(e_detail)) {
				top += heights[index];
			}
			index += 1;
		}
		return this.tops_ofDetails;
	}

	set_t_tree(e_trees: Array<E_Kinship>) {
		if (e_trees.length == 0) {
			e_trees = [E_Kinship.child];
		}
		w_e_tree.set(e_trees);
		let focus_ancestry = get(w_ancestry_focus);
		if (this.branches_areChildren) {
			this.parents_focus_ancestry = focus_ancestry;
			focus_ancestry = this.focus_ancestry;
		} else {
			this.focus_ancestry = focus_ancestry;
			focus_ancestry = this.parents_focus_ancestry ?? get(w_hierarchy).grabs_latest_ancestry;
		}
		w_show_related.set(e_trees.includes(E_Kinship.related));
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
			debug.log_expand(`  READ (${get(w_e_database)}): "${this.ids_forDB(expanded)}"`);
			w_ancestries_expanded.set(expanded);
		}
		setTimeout(() => {
			w_ancestries_expanded.subscribe((array: Array<Ancestry>) => {
				if (array.length > 0) {
					debug.log_expand(`  WRITING (${get(w_e_database)}): "${this.ids_forDB(array)}"`);
					p.ancestries_writeDB_key(array, this.expanded_key);
				}
			});
		}, 100);
	}

	restore_focus() {
		const h = get(w_hierarchy);
		let ancestryToFocus = h.rootAncestry;
		if (!p.ignoreAncestries && !c.eraseDB) {
			const key = this.branches_areChildren ? E_Preference.focus_forChildren : E_Preference.focus_forParents;
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

export let layout = new G_Layout();