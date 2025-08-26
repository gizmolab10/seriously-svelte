import { S_Widget, G_Cluster, G_TreeLine, G_TreeBranches } from '../common/Global_Imports';
import { k, u, ux, Rect, Size, Point, debug, Ancestry } from '../common/Global_Imports';
import { w_graph_rect, w_show_graph_ofType, w_device_isMobile} from '../managers/Stores';
import { w_show_details, w_show_related } from '../managers/Stores';
import { T_Widget, T_Graph } from '../common/Global_Imports';
import { w_depth_limit } from '../managers/Stores';
import { get } from 'svelte/store';

export default class G_Widget {
	g_bidirectionalLines: G_TreeLine[] = [];
	g_parentBranches: G_TreeBranches;
	g_childBranches: G_TreeBranches;
	center_ofReveal = Point.zero;
	offset_ofWidget = Point.zero;
	origin_ofWidget = Point.zero;
	origin_ofRadial = Point.zero;
	origin_ofTrunk = Point.zero;
	origin_ofTitle = Point.zero;
	center_ofDrag = Point.zero;
	widget_pointsNormal = true;
	size_ofSubtree = Size.zero;
	rect_ofTree = Rect.zero;
	forGraphMode: T_Graph;
	points_toChild = true;
	g_cluster!: G_Cluster;
	s_widget!: S_Widget;
	g_line!: G_TreeLine;
	ancestry!: Ancestry;
	width_ofWidget = 0;

	// create a G_TreeLine as normal
	// and one for each bidirectional

	get responder(): HTMLElement | null { return this.s_widget.responder; }

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
		this.s_widget = ux.s_widget_forAncestry(ancestry);
		this.forGraphMode = get(w_show_graph_ofType);
		this.ancestry = ancestry;
		if (!ancestry) {
			console.warn(`G_Widget is missing an ancestry`);
		} else if (!ancestry.thing) {
			console.warn(`G_Widget is missing a thing for "${ancestry.id}"`);
		}
	}

	static readonly _____PRIMITIVES: unique symbol;

	static empty(ancestry: Ancestry) { return new G_Widget(ancestry); }
	get absolute_center_ofDrag(): Point { return this.center_ofDrag.offsetBy(this.origin); }
	get absolute_center_ofReveal(): Point { return this.center_ofReveal.offsetBy(this.origin); }
	get showingReveal(): boolean { return this.ancestry.showsReveal_forPointingToChild(this.points_toChild) ?? false; }
	
	get origin(): Point {
		switch (this.t_widget) {
			case T_Widget.radial: return this.origin_ofRadial;
			case T_Widget.focus:  return this.origin_ofWidget;	// tree focus
			default:			  return this.origin_ofTrunk;
		}
	}

	static readonly _____LAYOUT: unique symbol;

	grand_layout_tree() {		// ???? misses every Widget.layout
		const depth_limit = get(w_depth_limit);
		this.layout_focus_ofTree();
		this.recursively_layout_subtree(depth_limit);
		this.recursively_layout_bidirectionals(depth_limit);
		this.adjust_focus_ofTree();
		this.update_rect_ofTree();
	}

	update_rect_ofTree() {
		const size = this.ancestry.size_ofVisibleSubtree.expandedByX(40);
		const origin = this.origin_ofWidget.offsetByXY(3, k.height.row - size.height / 2);
		this.rect_ofTree = new Rect(origin, size);
	}

	layout_necklaceWidget(
		rotated_origin: Point,
		widget_pointsNormal: boolean) {
			if (ux.inRadialMode) {
				this.forGraphMode = T_Graph.radial;
				this.origin_ofWidget = rotated_origin;
				this.widget_pointsNormal = widget_pointsNormal;
				this.layout_widget();
			}
	}

	layout_treeBranches(
		height: number = 0,
		origin: Point = Point.zero,
		forGraphMode = T_Graph.radial,
		points_toChild: boolean = true,
		widget_pointsNormal: boolean = true) {
		if (forGraphMode == get(w_show_graph_ofType)) {	// assure modes match
			const height_ofSubtree = this.ancestry.height_ofVisibleSubtree();
			const height_ofLines = height + height_ofSubtree / 2;
			const rect_ofLines = new Rect(origin, new Size(k.width.child_gap, height_ofLines - 1));
			const origin_ofWidget = this.origin_forAncestry_inRect(this.ancestry, rect_ofLines);
			this.g_line.rect = rect_ofLines.expand_widthBy(5);
			this.forGraphMode = forGraphMode;
			this.points_toChild = points_toChild;
			this.origin_ofWidget = origin_ofWidget;
			this.size_ofSubtree.height = height_ofSubtree;
			this.widget_pointsNormal = widget_pointsNormal;
			this.g_line.set_curve_type_forHeight(height_ofLines);
			this.layout_widget_andChildren();
		}
	}

	layout_widget() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing) {		// short-circuit mismatched graph mode
			const dot_size = k.height.dot;
			const radial_mode = ux.inRadialMode;
			const show_reveal = this.showingReveal;
			const width_ofReveal = show_reveal ? dot_size : 0;
			const widget_pointsNormal = this.widget_pointsNormal;
			const isRadialFocus = ux.inRadialMode && ancestry.isFocus;
			const width_ofDrag = (dot_size * 2) + (radial_mode ? 2 : -4);
			const width_ofWidget = ancestry.thing.width_ofTitle + width_ofDrag + width_ofReveal + (radial_mode ? 0 : 4);
			const x_ofDrag_forPointsBackwards = width_ofWidget - dot_size - 3 + (show_reveal ? 0.5 : 0);
			const x_ofDrag = widget_pointsNormal ? (radial_mode ? 3 : 2) : x_ofDrag_forPointsBackwards;
			const y_ofDrag = 2.5 + (radial_mode ? 0.1 : 0);
			const x_ofRadial = widget_pointsNormal ? -4 : -dot_size;
			const x_ofWidget = widget_pointsNormal ? -7 : 6 + dot_size - width_ofWidget;
			const x_ofRadial_title =  widget_pointsNormal && !isRadialFocus ? 20 : (show_reveal ? 20 : 8);
			const origin_ofDrag = new Point(x_ofDrag, y_ofDrag).offsetEquallyBy(dot_size / 2);
			this.origin_ofRadial = this.origin_ofWidget.offsetByXY(x_ofRadial, 4 - dot_size);
			this.origin_ofTitle = Point.x(radial_mode ? x_ofRadial_title : dot_size + 5);
			this.offset_ofWidget = new Point(x_ofWidget, 0.5);
			this.width_ofWidget = width_ofWidget;
			this.center_ofDrag = origin_ofDrag;
			if (show_reveal) {
				const y_ofReveal = dot_size * 0.7 - 0.5;
				const x_offset_forpointsNormal = width_ofWidget - dot_size - 10;
				const x_ofReveal = dot_size + (widget_pointsNormal ? x_offset_forpointsNormal : -3);
				this.center_ofReveal = new Point(x_ofReveal, y_ofReveal);
			}
		}
	}

	static readonly _____PRIVATE: unique symbol;

	private get t_widget(): T_Widget {
		const isFocus = this.ancestry?.isFocus ?? false;
		return ux.inTreeMode ? isFocus ? T_Widget.focus : T_Widget.tree : T_Widget.radial;
	}

	private origin_forAncestry_inRect(ancestry: Ancestry, rect: Rect): Point {
		const branch = ancestry.thing;
		let x, y = 0;
		if (!!branch) {
			y = rect.extent.y - ancestry.halfHeight_ofVisibleSubtree;
			x = rect.origin.x + branch.width_ofTitle + k.height.dot * 2 + k.width.child_gap - 7;
		}
		return new Point(x, y);
	}

	private layout_widget_andChildren() {
		debug.log_layout(`WIDGET ${this.ancestry.titles}`);
		this.g_childBranches.layout_branches();		// noop if childless, radial or collapsed
		this.layout_widget();						// assumes full progeny subtrees are laid out (needed for progeny size)
		this.layout_incoming_treeLine();
	}

	private layout_incoming_treeLine() {
		const ancestry = this.ancestry;
		if (!!ancestry.thing && ux.inTreeMode) {
			const offset = k.height.row;
			const offset_ofBranch = new Point(offset, -(7.8 + offset / 25));
			this.origin_ofTrunk = this.g_line.rect.extent.offsetBy(offset_ofBranch);
			this.g_line.update_svg_andName();
		}
	}

	private layout_bidirectional_lines(bidirectionals: G_TreeLine[]) {
		const g_lines = this.ancestry.g_lines_forBidirectionals;
		for (const g_line of g_lines) {
			if (!u.hasMatching_bidirectional(bidirectionals, g_line)) {
				this.g_bidirectionalLines.push(g_line);
				g_line.update_svg_andName();
			}
		}
		return this.g_bidirectionalLines;
	}

	private recursively_layout_subtree(depth: number, visited: string[] = []) {
		if (depth > 0) {
			const ancestry = this.ancestry;	
			if (!visited.includes(ancestry.id) && ancestry.shows_branches && depth > 0) {
				const branchAncestries = ancestry.branchAncestries;
				for (const branchAncestry of branchAncestries) {
					branchAncestry.g_widget.recursively_layout_subtree(depth - 1, [...visited, branchAncestry.id]);		// layout progeny first
				}
			}
			this.layout_widget_andChildren();
		}
	}

	private recursively_layout_bidirectionals(depth: number, visited: string[] = [], bidirectionals: G_TreeLine[] = []) {
		if (ux.inTreeMode && get(w_show_related) && depth > 0) {
			this.g_bidirectionalLines = [];
			const more = this.layout_bidirectional_lines(bidirectionals);
			const ancestry = this.ancestry;	
			if (!visited.includes(ancestry.id) && ancestry.shows_branches) {
				const childAncestries = ancestry.childAncestries;
				for (const childAncestry of childAncestries) {
					childAncestry.g_widget.recursively_layout_bidirectionals(		// layout progeny first
						depth - 1,
						[...visited, childAncestry.id],
						[...bidirectionals, ...more]);
				}
			}
		}
	}

	private layout_focus_ofTree() {
		const ancestry = this.ancestry;
		const graph_rect = get(w_graph_rect);
		if (!!graph_rect && ux.inTreeMode && ancestry?.isFocus) {
			const y_offset = graph_rect.origin.y;
			const subtree_size = ancestry.size_ofVisibleSubtree;
			const x_offset_ofFirstReveal = (ancestry.thing?.width_ofTitle ?? 0) / 2 - 2;
			const y_offset_ofBranches = (k.height.dot / 2) -(subtree_size.height / 2) - 4;
			const x_offset_ofBranches = -8 - k.height.dot + x_offset_ofFirstReveal;
			const x_offset = (get(w_show_details) ? -k.width.details : 0) + 15 + x_offset_ofFirstReveal - (subtree_size.width / 2) - (k.height.dot / 2.5);
			const origin_ofFocusReveal = graph_rect.center.offsetByXY(x_offset, -y_offset);
			if (get(w_device_isMobile)) {
				origin_ofFocusReveal.x = 25;
			}
			// need this for laying out branches, but it is wrong for final positioning
			// TODO: dunno why, must fix
			this.origin_ofWidget = origin_ofFocusReveal.offsetByXY(x_offset_ofBranches, y_offset_ofBranches);
		}
	}

	private adjust_focus_ofTree() {
		const ancestry = this.ancestry;
		const graph_rect = get(w_graph_rect);
		if (!!graph_rect && ux.inTreeMode && ancestry?.isFocus) {
			const y_offset = -1 - graph_rect.origin.y;
			const subtree_size = ancestry.size_ofVisibleSubtree;
			const x_offset_ofReveal = (ancestry.thing?.width_ofTitle ?? 0) / 2 - 2;
			const x_offset_forDetails = (get(w_show_details) ? -k.width.details : 0);
			const x_offset = 15 + x_offset_forDetails - (subtree_size.width / 2) - (k.height.dot / 2.5) + x_offset_ofReveal;
			const origin_ofFocusReveal = graph_rect.center.offsetByXY(x_offset, y_offset);
			this.origin_ofWidget = origin_ofFocusReveal.offsetByXY(-21.5 - x_offset_ofReveal, -5);
		}
	}
	
}
