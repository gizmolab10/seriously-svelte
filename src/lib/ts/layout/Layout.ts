import { T_Info, T_Graph, T_Banner, T_Details, T_Hierarchy, T_Preference } from '../common/Global_Imports';
import { c, k, p, u, debug, signals, Ancestry, G_RadialGraph } from '../common/Global_Imports';
import { w_t_database, w_ancestry_focus, w_ancestries_expanded } from '../common/Stores';
import { w_t_tree, w_t_graph, w_t_details, w_hierarchy } from '../common/Stores';
import { get } from 'svelte/store';

class Verticals {
	tops: Array<number> = [];
	heights: Array<number> = [];

	constructor(capacity: number) {
		this.tops = new Array(capacity).fill(0);
		this.heights = new Array(capacity).fill(0);
	}
}

export default class Layout {
	verticals_ofBanners = new Verticals(3);
	verticals_ofDetails = new Verticals(4);
	branches_visited: Array<string> = [];
	verticals_ofInfo = new Verticals(9);
	parents_focus_ancestry!: Ancestry;
	_g_radialGraph!: G_RadialGraph;
	focus_ancestry!: Ancestry;

	get inTreeMode(): boolean { return get(w_t_graph) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_t_graph) == T_Graph.radial; }
	top_ofInfoAt(index: number) { return this.verticals_ofInfo.tops[index]; }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	height_ofBannerAt(index: number) { return this.verticals_ofBanners.heights[index]; }
	get branches_areChildren(): boolean { return get(w_t_tree) == T_Hierarchy.children; }
	top_ofBannerAt(index: number) { return this.verticals_ofBanners.tops[index] + k.separator_thickness; }
	get tops_ofBanners(): Array<number> { return this.verticals_ofBanners.tops.map(top => top + k.separator_thickness); }
	get tops_ofDetails(): Array<number> { return this.verticals_ofDetails.tops.map(top => top + k.separator_thickness); }
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
		const type = types[0];	// only ever has one element
		switch (name) {
			case 'graph': w_t_graph.set(type as T_Graph); break;
			case 'tree': this.set_t_tree(type as T_Hierarchy);; break;
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
			const height = this.height_ofInfoAt(i);
			this.verticals_ofInfo.heights[i] = height;
			this.verticals_ofInfo.tops[i] = top;
			top += height;
		}
	}

	height_ofInfoAt(index: number): number {
		switch (index) {
			case T_Info.segments:	  return  21;
			case T_Info.before_title: return   4;
			case T_Info.title:		  return  17;
			case T_Info.after_title:  return   4;
			case T_Info.table:		  return 139;
			case T_Info.color:		  return   2;
			case T_Info.traits:		  return   2;
			case T_Info.consequence:  return  50;
			default:				  return  50;
		}
	}
	
	layout_tops_forPanelBanners() {
		this.verticals_ofBanners.heights = [k.row_height - 5, k.row_height, k.row_height];
		let index = 0;
		let top = 2;
		while (index <= T_Banner.graph) {
			this.verticals_ofBanners.tops[index] = top;
			top += this.verticals_ofBanners.heights[index] + 4;
			index += 1;
		}
	}
	
	layout_tops_forDetails() {
		let top = this.top_ofBannerAt(T_Banner.crumbs) + 8;
		this.verticals_ofDetails.heights = [118, 40, 76, 0];
		let index = 0;
		let indices = get(w_t_details);
		while (index <= T_Details.info) {
			this.verticals_ofDetails.tops[index] = top;
			const t_detail = T_Details[index] as unknown as T_Details;
			if (indices.includes(t_detail)) {
				top += this.verticals_ofDetails.heights[index];
			}
			index += 1;
		}
	}

	set_t_tree(t_tree: T_Hierarchy) {
		w_t_tree.set(t_tree);
		let focus_ancestry = get(w_ancestry_focus);
		if (this.branches_areChildren) {
			this.parents_focus_ancestry = focus_ancestry;
			focus_ancestry = this.focus_ancestry;
		} else {
			this.focus_ancestry = focus_ancestry;
			focus_ancestry = this.parents_focus_ancestry ?? get(w_hierarchy).grabs_latest_ancestry;
		}
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

export let layout = new Layout();