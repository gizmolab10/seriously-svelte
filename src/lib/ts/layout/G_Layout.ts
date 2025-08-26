import { h, k, p, u, ux, tree, Size, Rect, Point, Thing, debug, signals, Ancestry } from '../common/Global_Imports';
import { w_user_graph_offset, w_user_graph_center, w_mouse_location_scaled } from '../managers/Stores';
import { T_Graph, S_Component, T_Preference, G_RadialGraph } from '../common/Global_Imports';
import { w_graph_rect, w_show_details } from '../managers/Stores';
import { w_show_graph_ofType } from '../managers/Stores';
import { w_ancestry_focus } from '../managers/Stores';
import { get } from 'svelte/store';

export default class G_Layout {
	_g_radialGraph!: G_RadialGraph;
	scale_factor = 1;

	static readonly _____GRAND: unique symbol;

	grand_build(component: S_Component | null = null) {
		signals.signal_rebuildGraph_fromFocus(component);
	}
	
	grand_sweep(component: S_Component | null = null) {
		h.ancestries_assureAll_createUnique();
		this.grand_layout(component);
		this.grand_build(component);
	}

	grand_layout(component: S_Component | null = null) {
		if (ux.inRadialMode) {
			this.g_radialGraph.grand_layout_radial();
		} else {
			tree.grand_layout_tree();
		}
		signals.signal_reposition_widgets_fromFocus(component);
		signals.signal_reattach_widgets_fromFocus(component);
	}

	grand_adjust_toFit() {
		const layout_size = this.tree_size;
		const graph_size = get(w_graph_rect).size;
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
	
	get center_ofGraphRect(): Point { return get(w_graph_rect).size.asPoint.dividedInHalf; }
	get tree_size(): Size { return ux.inRadialMode ? this.size_ofNecklace : h.rootAncestry?.size_ofVisibleSubtree ?? Size.zero; }

	toggle_graph_type() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree:   w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree);   break;
		}
		this.grand_build();
	}

	graphRect_update() {
		// respond to changes in: window size & details visibility
		const thickness = k.thickness.separator.main - 1;
		const y = this.controls_boxHeight + 2;								// graph is below controls
		const x = get(w_show_details) ? k.width.details : thickness;		// graph is to the right of details
		const origin_ofGraph = new Point(x, y);
		const size_ofGraph = this.windowSize.reducedBy(origin_ofGraph).expandedEquallyBy(-thickness);
		const rect = new Rect(origin_ofGraph, size_ofGraph);
		debug.log_mouse(`GRAPH ====> ${rect.description}`);
		w_graph_rect.set(rect);												// emits a signal
	}

	static readonly _____DETAILS: unique symbol;

	get glows_banner_height(): number { return u.device_isMobile ? 32 : 20; }
	get controls_boxHeight(): number { return this.glows_banner_height + k.height.segmented; }

	static readonly _____GRAPHS: unique symbol;

	private get size_ofNecklace(): Size { return this.g_radialGraph.size_ofNecklace; }
	get rect_ofTree(): Rect { return tree.rect_ofTree ?? Rect.zero; }
	get offset_rect_ofDrawnGraph(): Rect { return this.rect_ofDrawnGraph.offsetBy(get(w_user_graph_offset)); }
	get rect_ofDrawnGraph(): Rect { return ux.inRadialMode ? this.g_radialGraph.rect_ofNecklace : this.rect_ofTree; }
	get size_ofDrawnGraph(): Size { return ux.inRadialMode ? this.g_radialGraph.size_ofNecklace : this.rect_ofTree.size; }
	get g_radialGraph() { let g = this._g_radialGraph; if (!g) { g = new G_RadialGraph(); this._g_radialGraph = g }; return g; }

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
		// const doc = document.documentElement;
		// doc.style.setProperty('zoom', scale_factor.toString());
		// doc.style.height = `${100 / scale_factor}%`;
		// doc.style.width = `${100 / scale_factor}%`;
		// this.graphRect_update();
	}

	static readonly _____USER_OFFSET: unique symbol;
	
	renormalize_user_graph_offset() { this.set_user_graph_offsetTo(this.persisted_user_offset); }
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
		if (!!current_offset && current_offset.vector_to(user_offset).magnitude > 1) {
			p.write_key(T_Preference.user_offset, user_offset);		// persist the property user_offset
			changed = true;
		}
		const center_offset = get(w_graph_rect).center.offsetBy(user_offset);	// center of the graph in window coordinates
		w_user_graph_center.set(center_offset);									// w_user_graph_center: a signal change
		w_user_graph_offset.set(user_offset);									// w_user_graph_offset: a signal change
		debug.log_mouse(`USER ====> ${user_offset.verbose}  ${center_offset.verbose}`);
		return changed;
	}

	ancestry_isCentered(ancestry: Ancestry | null): boolean {
		const title_center = ancestry?.center_ofTitle;
		if (!!title_center) {
			const center = get(w_user_graph_center);
			const user_offset = get(w_user_graph_offset);
			const delta = title_center.vector_to(center).vector_to(user_offset).magnitude;
			return delta < 1;
		}
		return false;
	}

	ancestry_place_atCenter(ancestry: Ancestry | null) {
		const title_center = ancestry?.center_ofTitle;
		if (!!title_center) {
			const center = get(w_user_graph_center);
			const offset = title_center.vector_to(center);	// use this vector to set the user graph offset
			this.set_user_graph_offsetTo(offset);
		}
	}

	static readonly _____BREADCRUMBS: unique symbol;

	get breadcrumbs_top(): number { return this.windowSize.height - this.controls_boxHeight; }

	layout_breadcrumbs_forAncestry_centered_starting_within(ancestry: Ancestry, centered: boolean, left: number, thresholdWidth: number): [Array<Thing>, number[], number[], number] {
		const crumb_things: Array<Thing> = [];
		const widths: number[] = [];
		let parent_widths = 0;						// encoded as one parent count per 2 digits (base 10) ... for triggering redraw
		let total = 0;								// determine how many crumbs will fit
		const things = ancestry.ancestors?.reverse() ?? [];
		for (const thing of things) {
			if (!!thing) {
				const width = u.getWidthOf(thing.breadcrumb_title) + 29;	// 29 px gap for separator character and button border
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
			left += (thresholdWidth - total) / 2;
		}
		let lefts = [left];
		for (const width of widths.reverse()) {
			left += width;				// position of next crumb
			lefts.push(left);
		}
		return [crumb_things.reverse(), widths.reverse(), lefts, parent_widths];
	}

}

export let layout = new G_Layout();