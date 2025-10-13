import { k, u, Rect, Size, Point, debug, elements, controls, Ancestry } from '../common/Global_Imports';
import { S_Widget, G_Cluster, G_TreeLine, G_TreeBranches } from '../common/Global_Imports';
import { w_show_graph_ofType, w_show_related } from '../managers/Stores';
import { T_Widget, T_Graph } from '../common/Global_Imports';
import { get } from 'svelte/store';

export default class G_Widget {
	g_bidirectionalLines: G_TreeLine[] = [];
	timestamp = new Date().getTime();
	location_ofNecklace = Point.zero;
	g_parentBranches: G_TreeBranches;	// <future>
	g_childBranches: G_TreeBranches;	// scratchpad size_ofSubtree.height and center (of subtree)
	location_ofRadial = Point.zero;
	center_ofReveal = Point.zero;
	offset_ofWidget = Point.zero;
	origin_ofWidget = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofTrunk = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	widget_points_right = true;
	size_ofSubtree = Size.zero;
	width_ofDrawnGraph = 0;
	points_toChild = true;
	g_cluster!: G_Cluster;
	s_widget!: S_Widget;
	g_line!: G_TreeLine;
	ancestry!: Ancestry;
	width_ofWidget = 0;
	t_graph: T_Graph;

	// create a G_TreeLine as normal
	// and one for each bidirectional

	get html_element(): HTMLElement | null { return this.s_widget.html_element; }

	// single source of truth for widget's
	//
	// widget_width (computed here)
	// UX state (fill, border) 
	// relevant ancestries (children, thing, shows reveal)
	// locations of:
	//	 rects for lines from: parent and bidirectionals
	//	 dots and title for:
	//		child tree
	//		radial origin, angles and orientations (in/out, right/left)

	constructor(ancestry: Ancestry) {
		this.g_line = new G_TreeLine(ancestry.parentAncestry, ancestry);
		this.g_parentBranches = new G_TreeBranches(ancestry, false);
		this.g_childBranches = new G_TreeBranches(ancestry);
		this.s_widget = elements.s_widget_forAncestry(ancestry);
		this.t_graph = get(w_show_graph_ofType);
		this.ancestry = ancestry;
		if (!ancestry) {
			console.warn(`G_Widget is missing an ancestry`);
		} else if (!ancestry.thing) {
			console.warn(`G_Widget is missing a thing for "${ancestry.id}"`);
		}
	}

	static readonly _____PRIMITIVES: unique symbol;

	static empty(ancestry: Ancestry) { return new G_Widget(ancestry); }
	get absolute_center_ofDrag(): Point { return this.origin.offsetBy(this.center_ofDrag); }
	get absolute_center_ofReveal(): Point { return this.origin.offsetBy(this.center_ofReveal); }
	get origin_ofDrawnGraph(): Point { return this.t_widget == T_Widget.radial ? this.origin_ofRadial : this.origin; }
	get showingReveal(): boolean { return this.ancestry.showsReveal_forPointingToChild(this.points_toChild) ?? false; }

	private get t_widget(): T_Widget {
		const isFocus = this.ancestry?.isFocus ?? false;
		return controls.inRadialMode ? T_Widget.radial : isFocus ? T_Widget.focus : T_Widget.tree;
	}

	get origin(): Point {
		switch (this.t_widget) {
			case T_Widget.radial: return this.location_ofRadial;
			case T_Widget.focus:  return this.origin_ofWidget;	// tree focus
			default:			  return this.origin_ofTrunk;
		}
	}

	static readonly _____LAYOUT: unique symbol;

	layout_bidirectional_lines(bidirectionals: G_TreeLine[]) {
		const g_lines = this.ancestry.g_lines_forBidirectionals;
		for (const g_line of g_lines) {
			if (!u.hasMatching_bidirectional(bidirectionals, g_line)) {
				this.g_bidirectionalLines.push(g_line);
				g_line.update_svg_andName();
			}
		}
		return this.g_bidirectionalLines;
	}

	layout_each_generation_recursively(depth: number, visited: string[] = []) {
		if (depth > 0) {
			const ancestry = this.ancestry;	
			if (!visited.includes(ancestry.id) && ancestry.shows_branches && depth > 0) {
				const branchAncestries = ancestry.branchAncestries;
				for (const branchAncestry of branchAncestries) {
					branchAncestry.g_widget.layout_each_generation_recursively(depth - 1, [...visited, branchAncestry.id]);		// layout progeny first
				}
			}

			this.layout_one_generation();			// <-- this is the heavy lifter

		}
	}

	private layout_one_generation() {
		this.g_childBranches.layout_subtree();		// noop if childless, radial or collapsed ... FUBAR: BAD origin_ofWidget, after switching to radial, refocusing, then back again
		this.layout_widget();						// assumes full progeny subtrees are laid out (needed for progeny size)
		this.layout_origin_ofTrunk();
		debug.log_layout(`WIDGET one generation ${this.origin.verbose} ${this.ancestry.title}`);
	}

	private layout_origin_ofTrunk() {
		if (!!this.ancestry && controls.inTreeMode) {
			this.origin_ofTrunk = this.g_line.rect.extent.offsetByXY(k.height.row, -8.6);
			this.g_line.update_svg_andName();
		}
	}

	layout_each_bidirectional_generation_recursively(depth: number, visited: string[] = [], bidirectionals: G_TreeLine[] = []) {
		if (controls.inTreeMode && get(w_show_related) && depth > 0) {
			this.g_bidirectionalLines = [];
			const more = this.layout_bidirectional_lines(bidirectionals);
			const ancestry = this.ancestry;	
			if (!visited.includes(ancestry.id) && ancestry.shows_branches) {
				const childAncestries = ancestry.childAncestries;
				for (const childAncestry of childAncestries) {
					childAncestry.g_widget.layout_each_bidirectional_generation_recursively(		// layout progeny first
						depth - 1,
						[...visited, childAncestry.id],
						[...bidirectionals, ...more]);
				}
			}
		}
	}

	layout_subtree(
		height: number = 0,
		origin: Point = Point.zero,
		t_graph = T_Graph.radial,
		points_toChild: boolean = true,
		widget_points_right: boolean = true) {

		if (t_graph == get(w_show_graph_ofType)) {	// assure modes match
			const height_ofSubtree = this.ancestry.height_ofVisibleSubtree();
			const height_ofLines = height + height_ofSubtree / 2;
			const rect_ofLines = new Rect(origin, new Size(k.width.child_gap, height_ofLines - 1));
			this.origin_ofWidget = this.origin_forAncestry_inRect(this.ancestry, rect_ofLines);
			this.g_line.rect = rect_ofLines.extend_widthBy(5);
			this.t_graph = t_graph;
			this.points_toChild = points_toChild;
			this.size_ofSubtree.height = height_ofSubtree;
			this.widget_points_right = widget_points_right;
			this.g_line.set_curve_type_forHeight(height_ofLines);
			this.layout_one_generation();
		}
	}

	layout_widget() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing) {
			const dot_size = k.height.dot;
			const show_reveal = this.showingReveal;
			const inRadialMode = controls.inRadialMode;
			const width_ofReveal = show_reveal ? dot_size : 0;
			const width_ofTitle = ancestry.thing.width_ofTitle;
			const widget_points_right = this.widget_points_right;
			const isRadialFocus = inRadialMode && ancestry.isFocus;
			const width_ofDrag = (dot_size * 2) + (inRadialMode ? 2 : -4);
			const width_ofWidget = width_ofTitle + width_ofDrag + width_ofReveal + (inRadialMode ? 0 : 4);
			const x_ofDrag_for_pointing_left = width_ofWidget - dot_size - 3 + (show_reveal ? 0.5 : 0);
			const x_ofDrag = widget_points_right ? (inRadialMode ? 3 : 2) : x_ofDrag_for_pointing_left;
			const y_ofDrag = 2.5 + (inRadialMode ? 0.1 : 0);
			const x_ofRadial = widget_points_right ? -4 : -dot_size;
			const x_offset_ofWidget = widget_points_right ? -7 : 6 + dot_size - width_ofWidget;
			const origin_ofDrag = new Point(x_ofDrag, y_ofDrag).offsetEquallyBy(dot_size / 2);
			const x_ofRadial_title =  widget_points_right && !isRadialFocus ? 20 : (show_reveal ? 20 : 8);
			if (!isRadialFocus) {	// not overwrite g_radial's location_ofRadial
				this.location_ofRadial = this.location_ofNecklace.offsetByXY(x_ofRadial, 4 - dot_size);
			}
			this.origin_ofRadial = this.location_ofRadial.offsetByX(widget_points_right ? 0 : -width_ofTitle - width_ofReveal);
			this.origin_ofTitle = Point.x(inRadialMode ? x_ofRadial_title : dot_size + 5);
			this.offset_ofWidget = new Point(x_offset_ofWidget, 0.5);
			this.width_ofDrawnGraph = width_ofWidget;
			this.width_ofWidget = width_ofWidget;
			this.center_ofDrag = origin_ofDrag;
			if (show_reveal) {
				const y_ofReveal = dot_size * 0.7 - 0.5;
				const x_offsetFor_points_right = width_ofWidget - dot_size - 10;
				const x_ofReveal = dot_size + (widget_points_right ? x_offsetFor_points_right : -3);
				this.center_ofReveal = new Point(x_ofReveal, y_ofReveal);
			}
		}
	}

	layout_necklaceWidget(rotated_origin: Point, widget_points_right: boolean) {
		if (controls.inRadialMode) {
			this.t_graph = T_Graph.radial;
			this.location_ofNecklace = rotated_origin;
			this.widget_points_right = widget_points_right;
			this.layout_widget();
			debug.log_layout(`WIDGET necklaceWidget ${this.origin.verbose} ${this.ancestry.title}`);
		}
	}

	static readonly _____PRIVATE: unique symbol;

	private origin_forAncestry_inRect(ancestry: Ancestry, rect: Rect): Point {
		const thing = ancestry.thing;
		let x, y = 0;
		if (!!thing) {
			y = rect.extent.y - ancestry.halfHeight_ofVisibleSubtree;
			x = rect.origin.x + thing.width_ofTitle + k.height.dot * 2 + k.width.child_gap - 7;
		}
		return new Point(x, y);
	}
	
}
