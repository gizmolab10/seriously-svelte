import { c, h, k, p, u, ux, Size, Rect, Point, Thing, grabs, debug, signals, Ancestry } from '../common/Global_Imports';
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
	scale_factor = 1;

	static readonly _____GRAND: unique symbol;

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
		const graph_size = get(w_graph_rect).size;
		const layout_size = ux.inRadialMode ? this.radial_size : this.tree_size;
		const scale_factor = layout_size.best_ratio_to(graph_size);
		const new_size = layout_size.dividedBy(scale_factor);
		const new_offset = get(w_user_graph_offset).dividedBy(scale_factor);
		// also detect if layout is really needed by difference from prior center and offset
		w_user_graph_center.set(new_size.asPoint.dividedInHalf);
		w_user_graph_offset.set(new_offset);
		this.set_scale_factor(scale_factor);
		this.grand_layout();
	}

	static readonly _____GRAPH_RECT: unique symbol;
	
	toggle_graph_type() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree:   w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree);   break;
		}
		this.grand_build();
	}

	graphRect_update() {
		// respond to changes in: window size & details visibility
		const y = this.panel_boxHeight + 2;			// account for origin at top
		const x = get(w_show_details) ? k.width_details : 0;
		const origin_ofGraph = new Point(x, y);
		const y_adjustment = !c.has_full_UI ? 4 : this.panel_boxHeight;
		const size_ofGraph = this.windowSize.reducedBy(origin_ofGraph).reducedByY(y_adjustment);
		const rect = new Rect(origin_ofGraph, size_ofGraph);
		debug.log_mouse(`GRAPH ====> ${rect.description}`);
		w_graph_rect.set(rect);										// used by Panel and Graph
	}
	
	handle_mode_selection(name: string, types: string[]) {
		switch (name) {
			case 'graph': w_show_graph_ofType.set(types[0] as unknown as T_Graph); break;
			case 'tree': this.set_tree_types(types as Array<T_Kinship>); break;
		}
	}
	
	set_tree_types(t_trees: Array<T_Kinship>) {
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

	static readonly _____WINDOW: unique symbol;
	
	get inner_windowSize(): Size { return new Size(window.innerWidth, window.innerHeight); }
	get windowSize(): Size { return this.inner_windowSize.dividedBy(this.scale_factor); }
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }

	restore_state() {
		this.graphRect_update();	// needed for set_scale_factor
		this.set_scale_factor(p.read_key(T_Preference.scale) ?? 1);
		this.renormalize_user_graph_offset();	// must be called after apply scale (which fubars offset)
		document.documentElement.style.setProperty('--css-body-width', this.windowSize.width.toString() + 'px');
	}

	static readonly _____SCALE_FACTOR: unique symbol;

	scaleBy(scale_factor: number): number {
		const zoom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('zoom')) || 1;
		this.set_scale_factor(zoom * scale_factor);
		return this.windowSize.width;
	}

	set_scale_factor(scale_factor: number) {
		// this.scale_factor = scale_factor;	// needed to edit things
		// p.write_key(T_Preference.scale, scale_factor);
		// const element = document.documentElement;
		// element.style.setProperty('zoom', scale_factor.toString());
		// element.style.height = `${100 / scale_factor}%`;
		// element.style.width = `${100 / scale_factor}%`;
		// this.graphRect_update();
	}

	static readonly _____USER_OFFSET: unique symbol;
	
	get mouse_distance_fromGraphCenter(): number { return this.mouse_vector_ofOffset_fromGraphCenter()?.magnitude ?? 0; }
	get mouse_angle_fromGraphCenter(): number | null { return this.mouse_vector_ofOffset_fromGraphCenter()?.angle ?? null; }

	get persisted_user_offset(): Point {
		const point = p.read_key(T_Preference.user_offset) ?? {x:0, y:0};
		return new Point(point.x, point.y);
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

	static readonly _____ANCESTRIES: unique symbol;

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

	layout_breadcrumbs_forAncestry_centered_starting_within(ancestry: Ancestry, centered: boolean, left: number, thresholdWidth: number): [Array<Thing>, number[], number[], number] {
		const crumb_things: Array<Thing> = [];
		const widths: number[] = [];
		let parent_widths = 0;						// encoded as one parent count per 2 digits (base 10) ... for triggering redraw
		let total = 0;								// determine how many crumbs will fit
		const things = ancestry.ancestors?.reverse() ?? [];
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
		if (centered) {
			left = (thresholdWidth - total) / 2;
		}
		let lefts = [left];
		for (const width of widths.reverse()) {
			left += width;				// position of next crumb
			lefts.push(left);
		}
		return [crumb_things.reverse(), widths.reverse(), lefts, parent_widths];
	}

	static readonly _____PRIMITIVES: unique symbol;

	get glows_banner_height(): number { return u.device_isMobile ? 32 : 20; }
	private get radial_size(): Size { return this.g_radialGraph.radial_size; }
	get panel_boxHeight(): number { return this.glows_banner_height + k.height.segmented; }
	get breadcrumbs_top(): number { return this.windowSize.height - this.panel_boxHeight; }
	get isAllExpanded(): boolean { return h.rootAncestry?.isAllProgeny_expanded ?? false; }
	get center_ofGraphSize(): Point { return get(w_graph_rect).size.asPoint.dividedInHalf; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }
	renormalize_user_graph_offset() { this.set_user_graph_offsetTo(this.persisted_user_offset); }
	ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
	expandAll() { h.rootAncestry.traverse(ancestry => ancestry.expand()); }

	private get tree_size(): Size {
		const root = h.rootAncestry;
		const size = new Size(root.visibleSubtree_width(), root.visibleSubtree_height());
		return size;
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

}

export let layout = new G_Layout();