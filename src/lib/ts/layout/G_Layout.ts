import { h, k, p, u, ux, w, grabs, Rect, Point, debug, signals, Ancestry, Thing, Size } from '../common/Global_Imports';
import { w_user_graph_offset, w_user_graph_center, w_mouse_location_scaled } from '../common/Stores';
import { T_Graph, T_Kinship, T_Preference, G_RadialGraph } from '../common/Global_Imports';
import { w_show_tree_ofType, w_show_graph_ofType } from '../common/Stores';
import { w_show_related, w_ancestry_focus } from '../common/Stores';
import { w_graph_rect, w_show_details } from '../common/Stores';
import { get } from 'svelte/store';

export default class G_Layout {
	parents_focus_ancestry!: Ancestry;
	branches_visited: string[] = [];
	_g_radialGraph!: G_RadialGraph;
	focus_ancestry!: Ancestry;

	get graph_top(): number { return this.banner_height + 25; }
	get banner_height(): number { return u.device_isMobile ? 32 : 16; }
	get breadcrumbs_height(): number { return this.banner_height + 21; }
	get breadcrumbs_top(): number { return w.windowSize.height - this.breadcrumbs_height; }
	get isAllExpanded(): boolean { return h.rootAncestry?.isAllProgeny_expanded ?? false; }
	get center_ofGraphSize(): Point { return get(w_graph_rect).size.asPoint.dividedInHalf; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }
	renormalize_user_graph_offset() { this.set_user_graph_offsetTo(this.persisted_user_offset); }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	height_ofBannerAt(index: number) { return Object.values(k.height.banner)[index]; }
	expandAll() { h.rootAncestry.traverse(ancestry => ancestry.expand()); }

	static readonly _____ANCESTRIES: unique symbol;

	layout_breadcrumbs_forAncestry_within(ancestry: Ancestry, thresholdWidth: number): [Array<Thing>, number[], number[], number] {
		const crumb_things: Array<Thing> = [];
		const widths: number[] = [];
		let parent_widths = 0;						// encoded as one parent count per 2 digits (base 10) ... for triggering redraw
		let total = 0;								// determine how many crumbs will fit
		const things = ancestry.ancestors ?? [];
		for (const thing of things) {
			if (!!thing) {
				const width = u.getWidthOf(thing.breadcrumb_title) + 29;
				if ((total + width) > thresholdWidth) {
					break;
				}
				total += width;
				widths.push(width);
				crumb_things.push(thing);
				debug.log_crumbs(`ONE ${width} ${thing.title}`);
				parent_widths = parent_widths * 100 + width;
			}
		}
		let left = 8;					// position of first crumb... was (thresholdWidth - total) / 2
		let lefts = [left];
		for (const width of widths) {
			left += width;				// position of next crumb
			lefts.push(left);
		}
		return [crumb_things, widths, lefts, parent_widths];
	}

	static readonly _____LAYOUT_AND_BUILD: unique symbol;

	grand_build() { signals.signal_rebuildGraph_fromFocus(); }

	grand_layout() {
		if (ux.inRadialMode) {
			this.g_radialGraph.grand_layout_radial();
		} else {
			get(w_ancestry_focus)?.g_widget.layout_entireTree();
		}
		signals.signal_reposition_widgets_fromFocus();
	}

	grand_adjust_toFit() {
		const size = ux.inRadialMode ? this.radial_size : this.tree_size;
		const graph_size = get(w_graph_rect).size;
		const scale_factor = graph_size.width / size.width;
		const new_size = size.scaledBy(scale_factor);
		const new_offset = get(w_user_graph_offset).scaledBy(scale_factor);
		w_user_graph_offset.set(new_offset);
		w_user_graph_center.set(new_size.asPoint.dividedInHalf);
		this.grand_layout();
	}

	get radial_size(): Size {
		return this.g_radialGraph.radial_size;
	}

	get tree_size(): Size {
		const root = h.rootAncestry;
		const size = new Size(root.visibleSubtree_width(), root.visibleSubtree_height());
		return size;
	}
	
	handle_mode_selection(name: string, types: string[]) {
		switch (name) {
			case 'graph': w_show_graph_ofType.set(types[0] as T_Graph); break;
			case 'tree': this.set_tree_type(types as Array<T_Kinship>); break;
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
	
	set_tree_type(t_trees: Array<T_Kinship>) {
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

	static readonly _____GRAPH: unique symbol;
	
	get mouse_distance_fromGraphCenter(): number { return this.mouse_vector_ofOffset_fromGraphCenter()?.magnitude ?? 0; }
	get mouse_angle_fromGraphCenter(): number | null { return this.mouse_vector_ofOffset_fromGraphCenter()?.angle ?? null; }

	get persisted_user_offset(): Point {
		const point = p.read_key(T_Preference.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
	}
	
	toggle_graph_type() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree: w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree); break;
		}
		this.grand_build();
	}

	mouse_vector_ofOffset_fromGraphCenter(offset: Point = Point.zero): Point | null {
		const mouse_location = get(w_mouse_location_scaled);
		if (!!mouse_location) {
			const center_offset = get(w_user_graph_center).offsetBy(offset);
			const mouse_vector = center_offset.vector_to(mouse_location);
			debug.log_mouse(`offset  ${get(w_user_graph_offset).verbose}  ${mouse_vector.verbose}`);
			return mouse_vector;
		}
		return null
	}

	ancestry_isCentered(ancestry: Ancestry | null): boolean {
		const title_center = ancestry?.center_ofTitle;
		if (!!title_center) {
			const center = get(w_user_graph_center);
			const offset = center.offsetBy(title_center.negated);
			const user_offset = get(w_user_graph_offset);
			const delta = offset.offsetBy(user_offset.negated).magnitude;
			// console.log('wrapper', title_center.description, 'delta', delta, ancestry?.title)
			return delta < 0.001;
		}
		return false;
	}

	place_ancestry_atCenter(ancestry: Ancestry | null) {
		// change the user graph offset to place
		// the ancestry at the center of the graph
		if (!ancestry) {	
			ancestry = h.rootAncestry;
		}
		const title_center = ancestry?.center_ofTitle;
		if (!!title_center) {
			const center = get(w_user_graph_center);
			const offset = center.offsetBy(title_center.negated);		// distance between centers: from graph to ancestry's widget's title
			this.set_user_graph_offsetTo(offset);
		}
	}

	set_user_graph_offsetTo(user_offset: Point): boolean {
		// user_offset of zero centers the graph
		let changed = false;
		const current_offset = get(w_user_graph_offset);
		if (!!current_offset && current_offset.vector_to(user_offset).magnitude > .001) {
			p.write_key(T_Preference.user_offset, user_offset);		// persist the property user_offset
			changed = true;
		}
		const center_offset = get(w_graph_rect).center.offsetBy(user_offset);	// center of the graph in window coordinates
		w_user_graph_center.set(center_offset);									// w_user_graph_center: a signal change
		w_user_graph_offset.set(user_offset);									// w_user_graph_offset: a signal change
		debug.log_mouse(`USER ====> ${user_offset.verbose}  ${center_offset.verbose}`);
		return changed;
	}

	graphRect_update() {
		// respond to changes in: window size & details visibility
		const y = this.graph_top - 2;			// account for origin at top
		const x = get(w_show_details) ? k.width_details : 0;
		const origin_ofGraph = new Point(x, y);
		const size_ofGraph = w.windowSize.reducedBy(origin_ofGraph).reducedByY(this.breadcrumbs_height);
		const rect = new Rect(origin_ofGraph, size_ofGraph);
		debug.log_mouse(`GRAPH ====> ${rect.description}`);
		w_graph_rect.set(rect);										// used by Panel and Graph
	}

}

export let layout = new G_Layout();